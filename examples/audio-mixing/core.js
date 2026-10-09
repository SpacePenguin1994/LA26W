(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AudioMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EPS = 1e-9;
  const determinant = ([a,b,c,d]) => a*d-b*c;
  const clean = x => Math.abs(x) < EPS ? 0 : x;
  const format = x => {
    if (Math.abs(x) < EPS) return '0';
    if (Math.abs(x - Math.round(x)) < EPS) return String(Math.round(x));
    if(Math.abs(x-Number(x.toFixed(3)))<EPS) return Number(x.toFixed(3)).toString();
    for(let denominator=2;denominator<=2000;denominator++){
      const numerator=Math.round(x*denominator);
      if(Math.abs(x-numerator/denominator)<EPS) return `${numerator}/${denominator}`;
    }
    return Number(x.toFixed(6)).toString();
  };
  function combination(a,b,x='v',y='m') {
    const terms = [];
    [[a,x],[b,y]].forEach(([k,name]) => {
      if(Math.abs(k)<EPS) return;
      const magnitude = Math.abs(k);
      const number=format(magnitude),coefficient=number.includes('/')?`(${number})`:number;
      terms.push((terms.length ? (k<0?' − ':' + ') : (k<0?'−':'')) + (Math.abs(magnitude-1)<EPS?'':coefficient) + name);
    });
    return terms.join('') || '0';
  }
  function analyze(matrix) {
    const det = clean(determinant(matrix));
    const rank = Math.abs(det)>EPS ? 2 : (matrix.some(x=>Math.abs(x)>EPS)?1:0);
    const [a,b,c,d]=matrix;
    return {det,rank,invertible:rank===2,inverse:rank===2?[d/det,-b/det,-c/det,a/det]:null};
  }
  function elimination(matrix) {
    const [a,b,c,d]=matrix;
    let rows=[[a,b,1,0],[c,d,0,1]], pivotRow=0;
    const steps=[];
    function record(title,detail) { rows=rows.map(row=>row.map(clean)); steps.push({title,detail,rows:rows.map(row=>row.slice())}); }
    record('从两条混音出发','左侧记录人声、音乐的系数；右侧记录对混音 u、w 的操作。');
    for(let col=0;col<2 && pivotRow<2;col++) {
      let candidate=pivotRow;
      while(candidate<2 && Math.abs(rows[candidate][col])<EPS) candidate++;
      if(candidate===2) continue;
      if(candidate!==pivotRow) {
        [rows[candidate],rows[pivotRow]]=[rows[pivotRow],rows[candidate]];
        record(`R${pivotRow+1} ↔ R${candidate+1}`,'交换两行，把可以使用的主元移到前面。');
      }
      const pivot=rows[pivotRow][col];
      if(Math.abs(pivot-1)>EPS) {
        rows[pivotRow]=rows[pivotRow].map(x=>x/pivot);
        record(`R${pivotRow+1} ← R${pivotRow+1} ÷ (${format(pivot)})`,'将这一行整体缩放，让主元变成 1。');
      }
      for(let row=0;row<2;row++) {
        if(row===pivotRow) continue;
        const factor=rows[row][col];
        if(Math.abs(factor)<EPS) continue;
        rows[row]=rows[row].map((x,j)=>x-factor*rows[pivotRow][j]);
        record(`R${row+1} ← R${row+1} ${factor>0?'−':'+'} ${Math.abs(Math.abs(factor)-1)<EPS?'':format(Math.abs(factor))}R${pivotRow+1}`,
          `叠加两条波形，消去第 ${col+1} 列的${col===0?'人声':'音乐'}分量。`);
      }
      pivotRow++;
    }
    return steps;
  }
  function mix(x,y,a,b) {
    if(x.length!==y.length) throw new Error('两条音轨必须具有相同长度');
    const out=new Float32Array(x.length);
    for(let i=0;i<out.length;i++) out[i]=a*x[i]+b*y[i];
    return out;
  }
  function rmsDifference(a,b) {
    let sum=0;
    for(let i=0;i<a.length;i++) sum+=(a[i]-b[i])**2;
    return Math.sqrt(sum/a.length);
  }
  function makeMusic(length,sampleRate) {
    const data=new Float32Array(length);
    const melody=[261.63,329.63,392,440,392,329.63,293.66,261.63,329.63,392,523.25,440,392,329.63,293.66,392];
    const beat=.4;
    for(let note=0;note*beat<length/sampleRate;note++) {
      const f=melody[note%melody.length], start=Math.round(note*beat*sampleRate);
      for(let j=0;j<sampleRate*.68 && start+j<length;j++) {
        const t=j/sampleRate, envelope=Math.min(1,t/.006)*Math.exp(-6*t);
        data[start+j]+=.32*envelope*(Math.sin(2*Math.PI*f*t)+.28*Math.sin(2*Math.PI*2*f*t)+.1*Math.sin(2*Math.PI*3*f*t));
      }
      if(note%4===0) {
        const bass=[130.815,174.615,164.815,196][Math.floor(note/4)%4];
        for(let j=0;j<sampleRate*1.5 && start+j<length;j++) {
          const t=j/sampleRate;
          data[start+j]+=.12*Math.min(1,t/.02)*Math.exp(-2.7*t)*Math.sin(2*Math.PI*bass*t);
        }
      }
    }
    return data;
  }
  return {EPS,format,combination,analyze,elimination,mix,rmsDifference,makeMusic};
});
