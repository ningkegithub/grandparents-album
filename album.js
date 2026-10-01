'use strict';
// Cards and the viewer always use the same stable chronological collection.
const dateKey = p => { const m=p.when.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/); return m?Number(m[1])*10000+Number(m[2])*100+Number(m[3]):Infinity; };
const photos=PHOTOS.map((p,order)=>({...p,order})).sort((a,b)=>dateKey(a)-dateKey(b)||a.order-b.order);
const $=id=>document.getElementById(id);
const viewer=$('viewer'), image=$('vimg'), audio=$('bgm');
let current=0,rendered=false,returnFocus=null,imageRequest=0,returnScroll=0;
const yearSections=[],yearFirstPhoto=new Map();
const photoYear=p=>(p.when.match(/^\d{4}/)||['日期待确认'])[0];
const YEAR_MEMORIES = {"2005":"那一年，宁可和卢慧还在北京工作。爷爷奶奶来北京一起游玩、登长城，也在租住的小屋里留下了日常合影。","2009":"四月在老家石燕塘留影。这一年，爷爷奶奶来到爱尔兰看望宁可一家。"};
// A touch or mouse interaction must not leave a keyboard focus ring behind.
document.addEventListener('keydown',()=>{document.documentElement.dataset.input='keyboard';});
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer';},{passive:true});
document.addEventListener('touchstart',()=>{document.documentElement.dataset.input='pointer';},{passive:true});
function textEl(tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
function renderAlbum(){
  if(rendered)return;rendered=true;const fragment=document.createDocumentFragment();let grid,previousYear;
  photos.forEach((p,index)=>{
    const match=p.when.match(/^\d{4}/),year=match?match[0]:'日期待确认';
    if(year!==previousYear){previousYear=year;const section=document.createElement('section');section.className='year';section.id='year-'+year;yearSections.push(section);yearFirstPhoto.set(year,index);
      const heading=textEl('h2','');heading.tabIndex=-1;heading.append(textEl('span',year));section.append(heading);if(YEAR_MEMORIES[year])section.append(textEl('p',YEAR_MEMORIES[year],'year-memory'));grid=document.createElement('div');grid.className='grid';section.append(grid);fragment.append(section);
      const option=textEl('option',year==='日期待确认'?year:year+'年');option.value=year;$('yearSelect').append(option);const viewerOption=textEl('option',option.textContent);viewerOption.value=year;$('viewerYearSelect').append(viewerOption);
    }
    const card=document.createElement('button');card.type='button';card.className='card';card.dataset.src=p.src;
    const thumb=document.createElement('img');thumb.src=p.thumb;thumb.alt='';thumb.loading='lazy';thumb.decoding='async';thumb.width=450;thumb.height=450;
    thumb.addEventListener('error',()=>{thumb.hidden=true;card.prepend(textEl('span','小图暂时没显示，点这里看看大图','thumb-error'));},{once:true});
    const copy=textEl('span','','card-copy');copy.append(textEl('span',p.when,'card-date'),textEl('span',p.title,'card-title'));card.append(thumb,copy);card.addEventListener('click',()=>openPhoto(index,card));grid.append(card);
  });$('timeline').append(fragment);
}
function startAlbum(focus=true){renderAlbum();$('cover').hidden=true;$('album').hidden=false;if(focus){window.scrollTo(0,0);$('yearSelect').focus();}syncVisibleYear();}
function showPhoto(index){
  current=Math.max(0,Math.min(photos.length-1,index));const p=photos[current];
  $('viewerYearSelect').value=photoYear(p);$('vwhen').textContent=p.when;$('vtitle').textContent=p.title;$('vdesc').textContent=p.desc;$('vcount').textContent=`${current+1} / ${photos.length}`;
  $('saveMainHint').textContent=p.quality==='preview'?'长按可保存当前预览图':p.quality==='full-resolution-derivative'?'长按照片，保存 JPEG 版本':'长按照片，选择“保存图片”';
  $('vprev').disabled=current===0;$('vnext').disabled=current===photos.length-1;resetInteraction();setSaveHelp(false);setCaptionVisible(true);
  loadImage(p);
}
function loadImage(p){
  const request=++imageRequest;image.hidden=true;$('imageFeedback').hidden=false;$('imageStatus').textContent='照片正在加载…';$('retryImage').hidden=true;image.alt=p.title+'。'+p.desc;
  const loader=new Image();loader.onload=()=>{if(request!==imageRequest)return;image.src=p.src;image.hidden=false;$('imageFeedback').hidden=true;};loader.onerror=()=>{if(request!==imageRequest)return;$('imageStatus').textContent='照片暂时没加载出来，请检查网络后重试。';$('retryImage').hidden=false;};loader.src=p.src;
}
function openPhoto(index,source){returnFocus=source||document.querySelector(`.card[data-src="${photos[index].src}"]`);if(!source&&returnFocus)returnFocus.scrollIntoView({block:'center'});returnScroll=window.scrollY;showPhoto(index);if(!viewer.open){viewer.showModal();document.body.style.overflow='hidden';}$('vclose').focus();}
$('startBtn').addEventListener('click',()=>startAlbum());
function syncVisibleYear(){
  if(!rendered||$('album').hidden||viewer.open)return;
  const edge=$('yearToolbar').getBoundingClientRect().bottom+20;let visible=yearSections[0];
  for(const section of yearSections){if(section.getBoundingClientRect().top<=edge)visible=section;else break;}
  if(visible)$('yearSelect').value=visible.id.slice(5);
}
let scrollFrame=0;window.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;syncVisibleYear();});},{passive:true});
window.addEventListener('resize',syncVisibleYear);
$('viewerYearSelect').addEventListener('change',()=>{const index=yearFirstPhoto.get($('viewerYearSelect').value);if(index!==undefined)showPhoto(index);});
$('yearSelect').addEventListener('change',()=>{const section=$('year-'+$('yearSelect').value);if(!section)return;section.scrollIntoView();section.querySelector('h2').focus({preventScroll:true});});
$('vclose').addEventListener('click',()=>viewer.close());viewer.addEventListener('close',()=>{resetInteraction();document.body.style.overflow='';if(returnFocus){returnFocus.focus({preventScroll:true});window.scrollTo(0,returnScroll);syncVisibleYear();}});
$('vprev').addEventListener('click',()=>showPhoto(current-1));$('vnext').addEventListener('click',()=>showPhoto(current+1));
viewer.addEventListener('keydown',event=>{if(event.target=== $('viewerYearSelect'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showPhoto(current+(event.key==='ArrowRight'?1:-1));}});
$('retryImage').addEventListener('click',()=>loadImage(photos[current]));
// The viewer uses high-resolution display images and labels any previews.
// Show help in the same reserved
// caption slot instead of opening a second screen or initiating a download.
function updateCaptionAccess(){
  const helping=viewer.classList.contains('show-save-help');
  $('captionCopy').setAttribute('aria-hidden',String(helping||viewer.classList.contains('hideui')));
  $('saveHelp').setAttribute('aria-hidden',String(!helping));
}
function setCaptionVisible(visible){viewer.classList.toggle('hideui',!visible);updateCaptionAccess();}
function setSaveHelp(show){viewer.classList.toggle('show-save-help',show);$('savePhoto').textContent=show?'知道了':'保存';$('savePhoto').setAttribute('aria-expanded',String(show));if(!show)viewer.classList.remove('hideui');updateCaptionAccess();}
$('savePhoto').addEventListener('click',()=>setSaveHelp(!viewer.classList.contains('show-save-help')));
function syncMusic(){const playing=!audio.paused;$('musicBtn').textContent=playing?'♫':'♪';$('musicBtn').title=playing?'关闭背景音乐':'播放背景音乐';$('musicBtn').setAttribute('aria-pressed',String(playing));$('musicBtn').setAttribute('aria-label',playing?'关闭背景音乐':'播放背景音乐');}
$('musicBtn').addEventListener('click',async()=>{if(!audio.paused){audio.pause();return;}try{await audio.play();$('musicStatus').textContent='';}catch(_){$('musicStatus').textContent='音乐暂时无法播放，可以继续看照片。';syncMusic();}});
audio.volume=.5;audio.addEventListener('play',syncMusic);audio.addEventListener('pause',syncMusic);audio.addEventListener('error',()=>{$('musicStatus').textContent='音乐暂时无法播放，可以继续看照片。';syncMusic();});
$('photoTotal').textContent=photos.length+' 张照片';

// Track only genuine short taps and clear horizontal swipes. Stationary long
// presses, native context menus, vertical movement and pinch belong to the browser.
const stage=$('stage'),points=new Map();
const PRESS_LIMIT_MS=450,MOVE_SLOP=12,SWIPE_DISTANCE=60;
let gestureMode='idle',hadMultiple=false,ignoreClickUntil=0,ignoreNextClick=false;
function releaseCaptures(){for(const id of points.keys()){if(stage.hasPointerCapture&&stage.hasPointerCapture(id))stage.releasePointerCapture(id);}}
function resetInteraction(){releaseCaptures();points.clear();gestureMode='idle';hadMultiple=false;}
function suppressFollowingClick(){ignoreClickUntil=Date.now()+1200;ignoreNextClick=true;}
function finishNativeGesture(){suppressFollowingClick();resetInteraction();}
stage.addEventListener('pointerdown',e=>{
  if((e.button!==undefined&&e.button!==0)||e.target.closest('button'))return;
  if(points.size===0){gestureMode='pending';hadMultiple=false;ignoreNextClick=false;}
  points.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,started:Date.now(),distance:0});
  if(points.size>1){hadMultiple=true;gestureMode='native';releaseCaptures();}
});
stage.addEventListener('pointermove',e=>{
  const p=points.get(e.pointerId);if(!p)return;
  p.x=e.clientX;p.y=e.clientY;const dx=p.x-p.startX,dy=p.y-p.startY;p.distance=Math.max(p.distance,Math.hypot(dx,dy));
  if(hadMultiple||gestureMode==='native')return;
  if(gestureMode==='pending'&&Date.now()-p.started>=PRESS_LIMIT_MS){gestureMode='native';suppressFollowingClick();return;}
  if(Math.abs(dy)>MOVE_SLOP&&Math.abs(dy)>=Math.abs(dx)){gestureMode='native';releaseCaptures();return;}
  if(gestureMode==='pending'&&Math.abs(dx)>MOVE_SLOP&&Math.abs(dx)>Math.abs(dy)*1.25){gestureMode='swipe';stage.setPointerCapture(e.pointerId);}
});
stage.addEventListener('pointerup',e=>{
  const p=points.get(e.pointerId);if(!p)return;
  const elapsed=Date.now()-p.started,dx=e.clientX-p.startX,dy=e.clientY-p.startY;
  p.distance=Math.max(p.distance,Math.hypot(dx,dy));
  const mode=gestureMode,multiple=hadMultiple;releaseCaptures();points.delete(e.pointerId);
  if(points.size)return;
  gestureMode='idle';hadMultiple=false;
  if(multiple||mode==='native'){suppressFollowingClick();return;}
  if(mode==='swipe'){suppressFollowingClick();if(Math.abs(dx)>SWIPE_DISTANCE)showPhoto(current+(dx<0?1:-1));return;}
  if(elapsed>=PRESS_LIMIT_MS||p.distance>MOVE_SLOP){suppressFollowingClick();return;}
  if(viewer.classList.contains('show-save-help'))setSaveHelp(false);
  else setCaptionVisible(viewer.classList.contains('hideui'));
});
stage.addEventListener('pointercancel',finishNativeGesture);
stage.addEventListener('contextmenu',finishNativeGesture); // Deliberately no preventDefault.
stage.addEventListener('click',e=>{if(ignoreNextClick||Date.now()<ignoreClickUntil){ignoreNextClick=false;e.stopImmediatePropagation();}});
