(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HarmonicLab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const presets={pure:[1,0,0,0,0,0],odd:[1,0,.65,0,.35,0],rich:[1,.8,.65,.5,.4,.3]};
  const noteFrequencies=[220,277.1826,329.6276,440,329.6276,277.1826,246.9417,220];
  const subscripts=['₁','₂','₃','₄','₅','₆'];
  const sample=(coefficients,cycles)=>coefficients.reduce((sum,a,k)=>sum+a*Math.sin(2*Math.PI*(k+1)*cycles),0);
  const norm=coefficients=>Math.hypot(...coefficients);
  const playbackGain=(coefficients,matched,volume=1)=>.12*volume/(matched?norm(coefficients)||1:1);
  const format=x=>Number(x.toFixed(2)).toString();
  function validCoefficients(values){
    return Array.isArray(values)&&values.length===6&&values[0]===1&&values.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1&&Math.abs(x*100-Math.round(x*100))<1e-8);
  }
  function formula(values){return 's = '+values.map((a,k)=>a?`${a===1?'':format(a)}h${subscripts[k]}`:'').filter(Boolean).join(' + ');}
  function init({getContext,stopOthers,volume}){
    const $=id=>document.getElementById(id);
    const state={coefficients:presets.pure.slice(),matched:true,mode:null,pending:null,request:0,voices:null,context:null};
    const controls=Array.from(document.querySelectorAll('[data-harmonic]'));
    function renderButtons(){
      for(const mode of ['tone','melody']){
        const button=$(`harmonic-${mode}`),active=state.mode===mode||state.pending===mode;
        button.setAttribute('aria-pressed',String(active));
        button.querySelector('use').setAttribute('href',active?'#i-stop':'#i-play');
        button.querySelector('span').textContent=state.pending===mode?'正在准备…':active?'停止试听':mode==='tone'?'播放长音':'听一段短旋律';
      }
      $('harmonics').classList.toggle('harmonic-playing',!!state.mode);
    }
    function plot(){
      const values=state.coefficients,points=641;
      const width=Math.max(220,Math.round($('harmonic-wave').getBoundingClientRect().width)||560),right=width-16;
      $('harmonic-wave').setAttribute('viewBox',`0 0 ${width} 220`);
      let peak=1;for(let i=0;i<points;i++)peak=Math.max(peak,Math.abs(sample(values,2*i/(points-1))));
      const bound=Math.ceil(peak*2)/2,px=x=>42+x*(right-42)/2,py=y=>103-y/bound*76;
      let svg='';
      for(const y of [-bound,0,bound])svg+=`<path d="M42 ${py(y)}H${right}" stroke="${y===0?'#b4c3d6':'#e3ebf3'}"/><text x="32" y="${py(y)+4}" text-anchor="end" fill="#71839b" font-size="13">${format(y)}</text>`;
      for(let k=0;k<=4;k++){
        const x=k/2;
        svg+=`<path d="M${px(x)} 27V179" stroke="#e3ebf3"/><text x="${px(x)}" y="201" text-anchor="middle" fill="#71839b" font-size="13">${format(1000*x/220)}</text>`;
      }
      const path=fn=>Array.from({length:points},(_,i)=>{const x=2*i/(points-1);return `${i?'L':'M'}${px(x).toFixed(2)} ${py(fn(x)).toFixed(2)}`;}).join(' ');
      svg+=`<path d="${path(x=>Math.sin(2*Math.PI*x))}" fill="none" stroke="#99a9bf" stroke-width="2" stroke-dasharray="5 5"/><path d="${path(x=>sample(values,x))}" fill="none" stroke="#069ec9" stroke-width="2.8" stroke-linejoin="round"/><text x="${right}" y="219" text-anchor="end" fill="#71839b" font-size="12">时间 / 毫秒</text>`;
      $('harmonic-wave').innerHTML=svg;
      $('harmonic-wave').setAttribute('aria-label',`两个基音周期的合成波形，${formula(values)}；振幅坐标范围正负 ${format(bound)}`);
      $('harmonic-scale').textContent=`原始振幅 · 纵轴 ±${format(bound)}`;
    }
    function render(){
      controls.forEach(input=>{const value=state.coefficients[Number(input.dataset.harmonic)];input.value=value;input.nextElementSibling.value=format(value);});
      document.querySelectorAll('[data-harmonic-preset]').forEach(button=>button.setAttribute('aria-pressed',String(presets[button.dataset.harmonicPreset].every((x,i)=>x===state.coefficients[i]))));
      $('harmonic-formula').textContent=formula(state.coefficients);
      $('harmonic-coordinates').textContent=`系数向量 (${state.coefficients.map(format).join(', ')})`;
      $('harmonic-match').checked=state.matched;
      plot();
    }
    function syncVolume(){
      if(!state.voices)return;
      const now=state.context.currentTime;
      state.voices.master.gain.setTargetAtTime(playbackGain(state.coefficients,state.matched,volume()),now,.02);
    }
    function configure(values,matched=state.matched){
      if(!validCoefficients(values)||typeof matched!=='boolean')throw new Error('请提供六个系数：首项为 1，其余为 0 到 1、步长 0.01 的数；电平匹配须为布尔值。');
      state.coefficients=values.slice();state.matched=matched;
      if(state.voices){
        const now=state.context.currentTime;
        state.voices.nodes.forEach((voice,k)=>voice.gain.gain.setTargetAtTime(values[k],now,.02));
        syncVolume();
      }
      render();return snapshot();
    }
    function stop(){
      state.request++;
      const wasActive=state.mode||state.pending,voices=state.voices;
      state.voices=null;state.mode=null;state.pending=null;
      if(voices){
        const now=state.context.currentTime;
        voices.envelope.gain.cancelScheduledValues(now);
        voices.envelope.gain.setTargetAtTime(0,now,.008);
        voices.nodes.forEach(voice=>{try{voice.oscillator.stop(now+.04);}catch{}});
      }
      renderButtons();
      if(wasActive)$('harmonic-status').textContent='已停止。保留当前系数，可继续比较。';
    }
    async function play(mode){
      if(state.mode===mode||state.pending===mode){stop();return;}
      stopOthers();
      const request=++state.request;state.pending=mode;renderButtons();
      try{
        const context=getContext();state.context=context;await context.resume();
        if(request!==state.request)return;
        const start=context.currentTime+.025,master=context.createGain(),envelope=context.createGain();
        const voices={nodes:[],master,envelope};state.voices=voices;
        master.gain.value=playbackGain(state.coefficients,state.matched,volume());
        envelope.gain.value=0;envelope.connect(master);master.connect(context.destination);
        if(mode==='tone'){
          envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(1,start+.03);
        }else{
          noteFrequencies.forEach((_,note)=>{
            const at=start+note*.42;
            envelope.gain.setValueAtTime(0,at);
            envelope.gain.linearRampToValueAtTime(1,at+.015);
            envelope.gain.linearRampToValueAtTime(.7,at+.09);
            envelope.gain.setValueAtTime(.7,at+.27);
            envelope.gain.linearRampToValueAtTime(0,at+.37);
          });
        }
        let remaining=6;
        state.coefficients.forEach((coefficient,k)=>{
          const oscillator=context.createOscillator(),gain=context.createGain();
          oscillator.type='sine';gain.gain.value=coefficient;
          oscillator.connect(gain);gain.connect(envelope);
          if(mode==='tone')oscillator.frequency.setValueAtTime(220*(k+1),start);
          else noteFrequencies.forEach((f,note)=>oscillator.frequency.setValueAtTime(f*(k+1),start+note*.42));
          oscillator.onended=()=>{
            oscillator.disconnect();gain.disconnect();
            if(--remaining===0){
              envelope.disconnect();master.disconnect();
              if(state.voices===voices){state.voices=null;state.mode=null;renderButtons();$('harmonic-status').textContent='短旋律播放完毕。换一个预设，再听同一段旋律。';}
            }
          };
          voices.nodes.push({oscillator,gain});oscillator.start(start);
          if(mode==='melody')oscillator.stop(start+noteFrequencies.length*.42);
        });
        state.pending=null;state.mode=mode;renderButtons();
        $('harmonic-status').textContent=mode==='tone'?'长音播放中 · 拖动系数或切换预设，实时听变化。':'短旋律播放中 · 音符与节奏固定，当前谐波比例实时生效。';
      }catch(error){
        if(request!==state.request)return;
        stop();$('harmonic-status').textContent=`无法播放：${error.message}`;
      }
    }
    function snapshot(){return {coefficients:state.coefficients.slice(),baseFrequency:220,levelMatched:state.matched,playing:state.mode};}
    controls.forEach(input=>input.addEventListener('input',()=>{const values=state.coefficients.slice();values[Number(input.dataset.harmonic)]=Number(input.value);configure(values);}));
    document.querySelectorAll('[data-harmonic-preset]').forEach(button=>button.addEventListener('click',()=>configure(presets[button.dataset.harmonicPreset])));
    $('harmonic-match').addEventListener('change',()=>configure(state.coefficients,$('harmonic-match').checked));
    $('harmonic-tone').addEventListener('click',()=>play('tone'));
    $('harmonic-melody').addEventListener('click',()=>play('melody'));
    $('harmonic-stop').addEventListener('click',stop);
    const context=document.modelContext;
    if(context?.registerTool){
      const lifecycle=new AbortController();
      const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
      register({name:'read_harmonics_experiment',title:'读取谐波音色实验',description:'读取谐波系数、电平匹配和试听状态。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:snapshot});
      register({name:'configure_harmonics_experiment',title:'调整谐波音色',description:'设置六个谐波系数，基音固定为 1；不启动播放，正在播放时实时更新音色。',inputSchema:{type:'object',properties:{coefficients:{type:'array',items:{type:'number',minimum:0,maximum:1,multipleOf:.01},minItems:6,maxItems:6},levelMatched:{type:'boolean'}},required:['coefficients'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(k=>!['coefficients','levelMatched'].includes(k)))throw new Error('仅接受 coefficients 和 levelMatched。');return configure(input.coefficients,input.levelMatched);}});
      window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
    }
    let plotWidth=0,resizeFrame=0;
    const observer=new ResizeObserver(entries=>{
      const width=Math.round(entries[0].contentRect.width);if(width===plotWidth)return;plotWidth=width;
      cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(plot);
    });
    observer.observe($('harmonic-wave'));
    window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(resizeFrame);},{once:true});
    render();renderButtons();
    return {stop,syncVolume,snapshot};
  }
  return {init,presets,noteFrequencies,sample,norm,playbackGain,validCoefficients,formula};
});
