(function(){
  'use strict';
  const M=window.AudioMath, $=id=>document.getElementById(id);
  const trackNames={v:'原始人声',m:'原始旋律',u:'混音 u',w:'混音 w',rv:'恢复的人声',rm:'恢复的旋律'};
  const state={matrix:[1,1,1,2],tracks:{},steps:[],step:-1,ready:false,done:false,sampleRate:24000,duration:0,playing:null,context:null,source:null,gain:null,animation:0,audioRequest:0};
  function readWave(base64){
    if(!base64) throw new Error('音频素材尚未就绪，请刷新页面。');
    const raw=atob(base64),bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const view=new DataView(bytes.buffer),text=(p,n)=>String.fromCharCode(...bytes.slice(p,p+n));
    if(text(0,4)!=='RIFF'||text(8,4)!=='WAVE') throw new Error('无法识别音频格式。');
    let rate=0,channels=0,bits=0,format=0,dataOffset=0,dataSize=0;
    for(let p=12;p+8<=bytes.length;){
      const size=view.getUint32(p+4,true),kind=text(p,4);
      if(kind==='fmt '){format=view.getUint16(p+8,true);channels=view.getUint16(p+10,true);rate=view.getUint32(p+12,true);bits=view.getUint16(p+22,true);}
      if(kind==='data'){dataOffset=p+8;dataSize=Math.min(size,bytes.length-dataOffset);break;}
      p+=8+size+(size%2);
    }
    if(format!==1||channels!==1||bits!==16||!rate||!dataOffset) throw new Error('音轨格式不受支持。');
    const data=new Float32Array(dataSize/2);let peak=0;
    for(let i=0;i<data.length;i++){data[i]=view.getInt16(dataOffset+i*2,true)/32768;peak=Math.max(peak,Math.abs(data[i]));}
    if(peak>0) for(let i=0;i<data.length;i++) data[i]*=.75/peak;
    return {data,rate};
  }
  const timeLabel=seconds=>`0:${String(Math.floor(seconds)).padStart(2,'0')}`;
  function buttonIcon(button,isPlaying){
    button.querySelector('use').setAttribute('href',isPlaying?'#i-stop':'#i-play');
    button.setAttribute('aria-label',`${isPlaying?'停止':'播放'}${trackNames[button.dataset.track]}`);
    button.setAttribute('aria-pressed',String(isPlaying));
  }
  function stopAudio(){
    state.audioRequest++;
    cancelAnimationFrame(state.animation);
    if(state.source){state.source.onended=null;try{state.source.stop();}catch{}state.source.disconnect();state.source=null;}
    if(state.gain){state.gain.disconnect();state.gain=null;}
    state.playing=null;
    document.querySelectorAll('[data-track]').forEach(button=>buttonIcon(button,false));
    document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));
    document.querySelectorAll('[data-time]').forEach(el=>el.textContent=timeLabel(state.duration));
  }
  async function playAudio(key){
    if(state.playing===key){stopAudio();return;}
    if(!state.ready||!state.tracks[key]||((key==='rv'||key==='rm')&&!state.done)) return;
    stopAudio();
    const request=state.audioRequest;
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext) throw new Error('此浏览器暂不支持音频播放，请用新版浏览器打开。');
      if(!state.context) state.context=new AudioContext();
      await state.context.resume();
      if(request!==state.audioRequest)return;
      const data=state.tracks[key],buffer=state.context.createBuffer(1,data.length,state.sampleRate);buffer.copyToChannel(data,0);
      const source=state.context.createBufferSource(),gain=state.context.createGain();
      gain.gain.value=.25*Number($('volume').value)/100;
      source.buffer=buffer;source.connect(gain);gain.connect(state.context.destination);
      state.source=source;state.gain=gain;state.playing=key;
      const start=state.context.currentTime;
      document.querySelectorAll(`[data-track="${key}"]`).forEach(button=>{buttonIcon(button,true);button.closest('.track,.result-card').classList.add('playing');});
      source.onended=()=>{if(state.source===source) stopAudio();};source.start();
      function animate(){
        if(state.source!==source) return;
        const elapsed=Math.min(state.duration,state.context.currentTime-start),progress=elapsed/state.duration;
        document.querySelectorAll('.playing .playhead').forEach(el=>el.style.left=`${Math.min(99.6,progress*100)}%`);
        const label=document.querySelector(`[data-time="${key}"]`);if(label) label.textContent=timeLabel(elapsed);
        state.animation=requestAnimationFrame(animate);
      }
      animate();
    }catch(error){$('audio-message').textContent=error.message;$('audio-message').classList.add('error');stopAudio();}
  }
  function drawWaves(){
    let scale=1;
    ['v','m','u','w'].forEach(key=>{const data=state.tracks[key];if(data)for(let i=0;i<data.length;i+=3)scale=Math.max(scale,Math.abs(data[i]));});
    for(const canvas of document.querySelectorAll('[data-wave]')){
      const key=canvas.dataset.wave,rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height) continue;
      const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
      const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
      const width=rect.width,height=rect.height,mid=height/2;
      ctx.strokeStyle='#d7e3ef';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,mid);ctx.lineTo(width,mid);ctx.stroke();
      const data=(key==='rv'||key==='rm')&&!state.done?null:state.tracks[key];if(!data)continue;
      const color=key==='m'||key==='rm'?'#8950df':key==='w'?'#6872cd':key==='u'?'#219abe':'#0ba8d1';
      const pixels=Math.floor(width/2),stride=Math.max(1,Math.floor(data.length/pixels));
      ctx.strokeStyle=color;ctx.lineWidth=1.25;ctx.beginPath();
      for(let pixel=0;pixel<pixels;pixel++){
        let low=0,high=0;const start=pixel*stride,end=Math.min(data.length,start+stride);
        for(let i=start;i<end;i++){low=Math.min(low,data[i]);high=Math.max(high,data[i]);}
        const x=pixel*2+.5;ctx.moveTo(x,mid-high/scale*height*.45);ctx.lineTo(x,mid-low/scale*height*.45);
      }
      ctx.stroke();
    }
  }
  function plotVectors(){
    const [a,b,c,d]=state.matrix,{rank}=M.analyze(state.matrix),cx=168,cy=127,unit=33;
    const px=x=>cx+x*unit,py=y=>cy-y*unit;
    let svg='<defs><marker id="arrow-u" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#079fca"/></marker><marker id="arrow-w" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#8851d9"/></marker></defs>';
    for(let k=-3;k<=3;k++){
      svg+=`<path d="M${px(k)} ${py(-3)}V${py(3)}M${px(-3)} ${py(k)}H${px(3)}" stroke="#eaf0f7" stroke-width="1"/>`;
      if(k!==0){svg+=`<text x="${px(k)}" y="${cy+17}" text-anchor="middle" fill="#8896aa" font-size="12">${k}</text><text x="${cx-10}" y="${py(k)+4}" text-anchor="end" fill="#8896aa" font-size="12">${k}</text>`;}
    }
    svg+=`<path d="M${px(-3.3)} ${cy}H${px(3.4)}M${cx} ${py(-3.3)}V${py(3.4)}" stroke="#9daec3" stroke-width="1.4"/><text x="${cx-10}" y="${cy+17}" text-anchor="end" fill="#8393a9" font-size="12">0</text><text x="${px(3.4)+5}" y="${cy+5}" fill="#6b7e98" font-size="12">人声</text><text x="${cx+10}" y="${py(3.4)}" fill="#6b7e98" font-size="12">旋律</text>`;
    if(rank===2)svg+=`<path d="M${cx} ${cy}L${px(a)} ${py(b)}L${px(c)} ${py(d)}Z" fill="#50c5e4" opacity=".12"/>`;
    [[a,b,'u','#079fca'],[c,d,'w','#8851d9']].forEach(([x,y,name,color],index)=>{
      if(Math.abs(x)+Math.abs(y)>M.EPS)svg+=`<path d="M${cx} ${cy}L${px(x)} ${py(y)}" stroke="${color}" stroke-width="${index?2.5:3.5}" ${rank<2&&index?'stroke-dasharray="5 3"':''} marker-end="url(#arrow-${name})"/>`;
      svg+=`<circle cx="${px(x)}" cy="${py(y)}" r="3.5" fill="${color}"/><text x="${px(x)+(x>1.5?-10:10)}" y="${py(y)+(index?-10:20)}" text-anchor="${x>1.5?'end':'start'}" fill="${color}" font-size="14" font-weight="600">${name} (${M.format(x)}, ${M.format(y)})</text>`;
    });
    $('vector-plot').innerHTML=svg;
    $('vector-plot').setAttribute('aria-label',`混音比例向量 u 为 (${a},${b})，w 为 (${c},${d})，${rank===2?'两组比例不共线':'两组比例线性相关'}`);
  }
  function renderMatrix(){
    const [a,b,c,d]=state.matrix,analysis=M.analyze(state.matrix);
    $('mix-matrix').innerHTML=state.matrix.map(x=>`<span>${M.format(x)}</span>`).join('');
    $('mix-matrix').setAttribute('aria-label',`混音矩阵，第一行 ${a} ${b}，第二行 ${c} ${d}`);
    $('matrix-status').textContent=analysis.invertible?'可以唯一恢复':analysis.rank===0?'全部静音，无法恢复':'信息重复，无法恢复全部原声';
    $('matrix-status').classList.toggle('singular',!analysis.invertible);$('matrix-insight').classList.toggle('singular',!analysis.invertible);
    let title,detail;
    if(analysis.invertible){title='两组比例不共线，可以分别消去一种声音。';detail='混音矩阵可逆。已知比例，就能用线性组合恢复两条原音轨。';}
    else if(analysis.rank===0){title='所有系数都是 0，两条混音都没有声音。';detail='原音轨的信息完全丢失，无法从静音中恢复原声。';}
    else if(Math.abs(a)+Math.abs(b)<M.EPS){title='第一条混音是静音，只剩一条有效混音。';detail='这不足以唯一确定两条任意的原始音轨。';}
    else{const k=Math.abs(a)>M.EPS?c/a:d/b;title=`w = ${M.format(k)}u：第二条没有增加分离信息。`;detail='两组混音比例线性相关。无论怎样消元，都无法唯一找回两条原音轨。';}
    $('matrix-insight').innerHTML=`<strong>${title}</strong><p>${detail}</p>`;
    plotVectors();
  }
  function recoveryRows(){
    const rows=state.steps[state.steps.length-1].rows;
    return [0,1].map(column=>rows.find(row=>Math.abs(row[column]-1)<M.EPS&&Math.abs(row[1-column])<M.EPS));
  }
  function recoveryReady(){
    if(!state.ready)return;
    recoveryRows().forEach((row,index)=>{if(row)state.tracks[index===0?'rv':'rm']=M.mix(state.tracks.u,state.tracks.w,row[2],row[3]);});
  }
  function renderResults(){
    const analysis=M.analyze(state.matrix),recovery=recoveryRows();
    $('singular-explanation').hidden=!(state.done&&!analysis.invertible);
    if(state.done&&!analysis.invertible){
      const [a,b,c,d]=state.matrix,row=Math.abs(a)+Math.abs(b)>M.EPS?[a,b]:[c,d];
      const max=Math.max(Math.abs(row[0]),Math.abs(row[1]));
      const nv=max?-row[1]/max:1,nm=max?row[0]/max:0;
      $('singular-detail').textContent=analysis.rank===0?'两条混音都恒为 0；任何原始音轨都会得到相同结果。':'消元后出现一行 0。取任意一段波形 h，下面这两条新音轨仍会得到完全相同的混音。';
      $('null-example').textContent=`v′ = ${M.combination(1,nv,'v','h')}，m′ = ${M.combination(1,nm,'m','h')}`;
    }
    for(const [kind,source,recoveryIndex] of [['v','v',0],['m','m',1]]){
      const row=recovery[recoveryIndex],shown=state.done&&!!row;
      const formula=$(`${kind}-recovery`);formula.classList.toggle('pending',!shown);
      formula.textContent=shown?`${kind} = ${M.combination(row[2],row[3],'u','w')}`:state.done?'无法唯一恢复':'完成消元后查看';
      const error=$(`${kind}-error`);
      if(shown&&state.ready){const rms=M.rmsDifference(state.tracks[source],state.tracks[`r${source}`]);error.textContent=rms<1e-5?'与原音轨一致 · 数值误差 < 0.00001':`恢复均方根误差 ${rms.toExponential(2)}`;}
      else error.textContent=state.done?'不同的原声也可能产生相同的混音':`将与原始${kind==='v'?'人声':'旋律'}对照`;
      document.querySelector(`[data-track="r${kind}"]`).disabled=!(shown&&state.ready);
    }
    drawWaves();
  }
  function renderStep(){
    const last=state.steps.length-1,index=Math.max(0,state.step),step=state.steps[index],analysis=M.analyze(state.matrix);
    if(!step)return;
    $('step-counter').textContent=state.step<0?'准备就绪':state.done?'消元完成':`第 ${index+1} / ${state.steps.length} 步`;
    $('step-title').textContent=state.done?(analysis.invertible?'左侧变成单位矩阵，原声回来了。':'出现零行，分离信息不足。'):step.title;
    $('step-description').textContent=state.done?(analysis.invertible?'右侧就是逆矩阵：它告诉你如何组合 u、w，分别恢复 v、m。':'剩下的等式无法唯一确定两条原始音轨。换一组混音比例再试试。'):step.detail;
    $('augmented-matrix').innerHTML=step.rows.flatMap(row=>row.map(x=>`<span>${M.format(x)}</span>`)).join('');
    $('augmented-matrix').setAttribute('aria-label',`增广矩阵：${step.rows.map(row=>row.map(M.format).join('，')).join('；')}`);
    $('step-equations').innerHTML=step.rows.map(row=>`<span>${M.combination(row[0],row[1])} = ${M.combination(row[2],row[3],'u','w')}</span>`).join('');
    $('step-dots').innerHTML=state.steps.map((_,i)=>`<span class="step-dot${state.step>=i?' active':''}"></span>`).join('');
    $('next-step').disabled=state.done;$('next-step').textContent=state.step<0?'开始消元':index>=last?'已完成':'下一步';
    $('finish-steps').disabled=state.done;
    renderResults();
  }
  function advanceStep(target){
    stopAudio();
    state.step=target==='finish'?state.steps.length-1:target==='start'?0:Math.min(state.steps.length-1,state.step+1);
    state.done=state.step===state.steps.length-1;
    if(state.done)recoveryReady();renderStep();
  }
  function updateMatrix(values){
    if(!Array.isArray(values)||values.length!==4||values.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<-3||x>3||Math.abs(x*10-Math.round(x*10))>M.EPS))throw new Error('请提供四个 −3 到 3 之间、步长为 0.1 的有限数。');
    stopAudio();state.matrix=values.slice();state.steps=M.elimination(values);state.step=-1;state.done=false;
    document.querySelectorAll('[data-coefficient]').forEach(input=>{const value=values[Number(input.dataset.coefficient)];input.value=value;input.nextElementSibling.value=M.format(value);});
    $('u-formula').textContent=`u = ${M.combination(values[0],values[1])}`;$('w-formula').textContent=`w = ${M.combination(values[2],values[3])}`;
    if(state.ready){state.tracks.u=M.mix(state.tracks.v,state.tracks.m,values[0],values[1]);state.tracks.w=M.mix(state.tracks.v,state.tracks.m,values[2],values[3]);delete state.tracks.rv;delete state.tracks.rm;}
    document.querySelectorAll('[data-preset]').forEach(button=>{const target=button.dataset.preset==='invertible'?[1,1,1,2]:[1,1,2,2];const active=values.every((x,i)=>Math.abs(x-target[i])<M.EPS);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    renderMatrix();renderStep();
  }
  document.querySelectorAll('[data-track]').forEach(button=>button.addEventListener('click',()=>playAudio(button.dataset.track)));
  document.querySelectorAll('[data-coefficient]').forEach(input=>input.addEventListener('input',()=>{const values=state.matrix.slice();values[Number(input.dataset.coefficient)]=Number(input.value);updateMatrix(values);}));
  document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>updateMatrix(button.dataset.preset==='invertible'?[1,1,1,2]:[1,1,2,2])));
  $('reset').addEventListener('click',()=>updateMatrix([1,1,1,2]));$('stop-all').addEventListener('click',stopAudio);
  $('volume').addEventListener('input',()=>{$('volume-value').value=`${$('volume').value}%`;if(state.gain&&state.context)state.gain.gain.setTargetAtTime(.25*Number($('volume').value)/100,state.context.currentTime,.03);});
  $('start-elimination').addEventListener('click',()=>{advanceStep('start');$('eliminate').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  $('next-step').addEventListener('click',()=>advanceStep('next'));$('finish-steps').addEventListener('click',()=>advanceStep('finish'));$('restart-steps').addEventListener('click',()=>advanceStep('start'));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')stopAudio();});window.addEventListener('pagehide',stopAudio);
  let resizeFrame;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(drawWaves);}).observe(document.querySelector('.workspace'));
  try{
    const voice=readWave(window.VOICE_WAV_BASE64);state.sampleRate=voice.rate;state.tracks.v=voice.data;state.tracks.m=M.makeMusic(voice.data.length,voice.rate);state.duration=voice.data.length/voice.rate;state.ready=true;
    $('audio-message').textContent='';document.querySelectorAll('[data-track]').forEach(button=>{if(!button.dataset.track.startsWith('r'))button.disabled=false;});
    document.querySelectorAll('[data-time]').forEach(el=>el.textContent=timeLabel(state.duration));
  }catch(error){$('audio-message').textContent=error.message;$('audio-message').classList.add('error');}
  updateMatrix(state.matrix);
  function snapshot(){const analysis=M.analyze(state.matrix);return {matrix:state.matrix.slice(),determinant:analysis.det,rank:analysis.rank,invertible:analysis.invertible,eliminationStep:state.step,eliminationComplete:state.done,audioReady:state.ready};}
  const context=document.modelContext;
  if(context?.registerTool){
    const lifecycle=new AbortController();
    const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
    register({name:'read_mixing_experiment',title:'读取混音实验',description:'读取页面当前混音系数、可逆性和消元进度，不播放声音。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>snapshot()});
    register({name:'configure_mixing_experiment',title:'调整混音比例',description:'设置页面上的四个混音系数；停止当前试听并重置消元步骤，不自动播放声音。',inputSchema:{type:'object',properties:{coefficients:{type:'array',items:{type:'number',minimum:-3,maximum:3,multipleOf:0.1},minItems:4,maxItems:4}},required:['coefficients'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).some(k=>k!=='coefficients'))throw new Error('仅接受 coefficients。');updateMatrix(input.coefficients);return snapshot();}});
    register({name:'complete_mixing_elimination',title:'完成混音消元',description:'在页面上显示当前混音矩阵的最终消元结果与可恢复音轨；不播放声音。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{advanceStep('finish');return snapshot();}});
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
