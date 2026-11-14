(function(){
  var html=document.documentElement, el=document.getElementById('intro');
  if(!el) return;
  if(html.classList.contains('intro-done')){el.remove();return;}
  try{sessionStorage.setItem('axisIntroVisto','1')}catch(e){}
  el.innerHTML='<svg viewBox="-150 10 660 230" role="img" aria-label="Axis"><g class="eixo"><line x1="-120" y1="126" x2="150" y2="126" stroke="#6E6E6E" stroke-width="4" stroke-dasharray="26 10 6 10"/></g><polyline class="lam" points="12,170 71,44 130,170" fill="none" stroke="#E6E6E6" stroke-width="11"/><line class="x1" x1="150" y1="44" x2="250" y2="170" stroke="#E6E6E6" stroke-width="11"/><line class="x2" x1="250" y1="44" x2="150" y2="170" stroke="#6E6E6E" stroke-width="11"/><text class="is" x="262" y="170" font-size="186" font-weight="300" fill="#E6E6E6">IS</text><text class="tag" x="180" y="226" text-anchor="middle" font-size="17" font-family="Inter,sans-serif" font-weight="500" letter-spacing="8" fill="#9A9A9A">GESTÃO DE OBRAS</text></svg>';
  var fechar=function(){html.classList.add('intro-saindo');setTimeout(function(){el.remove();html.classList.add('intro-done')},600)};
  setTimeout(fechar,3000);
  el.addEventListener('click',fechar);
})();
