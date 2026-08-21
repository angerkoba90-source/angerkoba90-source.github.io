(()=>{
'use strict';
if(window.__denisfitClientWorkflowV192)return;
window.__denisfitClientWorkflowV192=true;
document.documentElement.dataset.denisfitBuild='19.8.0';
const marker=()=>{
  const badge=document.getElementById('roleBadge');
  if(!badge||badge.dataset.build192)return;
  badge.dataset.build192='1';
  const small=document.createElement('small');
  small.textContent=' · 19.8';
  small.style.opacity='.55';
  small.style.fontSize='9px';
  badge.appendChild(small);
};
const script=document.createElement('script');
script.src='/client-workflow-v191.js?release=19.8.0-20260821';
script.async=false;
script.onload=()=>{marker();window.dispatchEvent(new Event('pageshow'))};
script.onerror=()=>console.error('DenisFit v19.8 workflow failed to load');
document.head.appendChild(script);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',marker,{once:true});else marker();
})();