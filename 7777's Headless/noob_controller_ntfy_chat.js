// ==UserScript==
// @name         Noob Controller
// @namespace    Violentmonkey Scripts
// @version      v0.25
// @description  7777
// @author       7777
// @match        *://arras.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arras.io
// @grant        none
// @run-at       document-end
// ==/UserScript==

// ==UserScript==
// @name         Noob Controller
// @namespace    Violentmonkey Scripts
// @version      v0.24
// @description  7777
// @author       7777
// @match        *://arras.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arras.io
// @grant        none
// @run-at       document-end
// ==/UserScript==

// ─── MSGPACK ─────────────────────────────────────────────────────────────────
const msgpack=(() => {
  const te=new TextEncoder(),td=new TextDecoder();
  function encode(v){const b=[];_enc(v,b);return new Uint8Array(b);}
  function _enc(v,b){
    if(v==null){b.push(0xc0);return;}
    if(v===false){b.push(0xc2);return;}
    if(v===true){b.push(0xc3);return;}
    if(typeof v==="number"){
      if(Number.isInteger(v)){
        if(v>=0){
          if(v<=0x7f)b.push(v);
          else if(v<=0xff)b.push(0xcc,v);
          else if(v<=0xffff)b.push(0xcd,v>>8,v&0xff);
          else b.push(0xce,(v>>>24)&0xff,(v>>>16)&0xff,(v>>>8)&0xff,v&0xff);
        } else {
          if(v>=-32)b.push(v&0xff);
          else if(v>=-128)b.push(0xd0,v&0xff);
          else if(v>=-32768)b.push(0xd1,(v>>8)&0xff,v&0xff);
          else b.push(0xd2,(v>>24)&0xff,(v>>16)&0xff,(v>>8)&0xff,v&0xff);
        }
      } else {
        const ab=new ArrayBuffer(8);new DataView(ab).setFloat64(0,v);
        const by2=new Uint8Array(ab);b.push(0xcb);for(let i=0;i<8;i++)b.push(by2[i]);
      }
      return;
    }
    if(typeof v==="string"){
      const bytes=te.encode(v),len=bytes.length;
      if(len<=31)b.push(0xa0|len);else if(len<=0xff)b.push(0xd9,len);
      else if(len<=0xffff)b.push(0xda,len>>8,len&0xff);
      else b.push(0xdb,(len>>>24)&0xff,(len>>>16)&0xff,(len>>>8)&0xff,len&0xff);
      for(let i=0;i<bytes.length;i++)b.push(bytes[i]);return;
    }
    if(Array.isArray(v)){
      const len=v.length;
      if(len<=15)b.push(0x90|len);else if(len<=0xffff)b.push(0xdc,len>>8,len&0xff);
      else b.push(0xdd,(len>>>24)&0xff,(len>>>16)&0xff,(len>>>8)&0xff,len&0xff);
      for(let i=0;i<len;i++)_enc(v[i],b);return;
    }
    if(typeof v==="object"){
      const keys=Object.keys(v),len=keys.length;
      if(len<=15)b.push(0x80|len);else if(len<=0xffff)b.push(0xde,len>>8,len&0xff);
      else b.push(0xdf,(len>>>24)&0xff,(len>>>16)&0xff,(len>>>8)&0xff,len&0xff);
      for(const k of keys){_enc(k,b);_enc(v[k],b);}
    }
  }
  function decode(input){const buf=input instanceof Uint8Array?input:new Uint8Array(input);return _dec({buf,pos:0});}
  function _dec(s){
    const b=s.buf[s.pos++];
    if(b<=0x7f)return b;
    if((b&0xe0)===0xe0)return b-256;
    if((b&0xf0)===0x90){const len=b&0x0f,a=[];for(let i=0;i<len;i++)a.push(_dec(s));return a;}
    if((b&0xf0)===0x80){const len=b&0x0f,o={};for(let i=0;i<len;i++){const k=_dec(s);o[k]=_dec(s);}return o;}
    if((b&0xe0)===0xa0)return _str(s,b&0x1f);
    switch(b){
      case 0xc0:return null;case 0xc2:return false;case 0xc3:return true;
      case 0xca:{const v=new DataView(s.buf.buffer,s.buf.byteOffset+s.pos).getFloat32(0);s.pos+=4;return v;}
      case 0xcb:{const v=new DataView(s.buf.buffer,s.buf.byteOffset+s.pos).getFloat64(0);s.pos+=8;return v;}
      case 0xcc:return s.buf[s.pos++];
      case 0xcd:{const v=(s.buf[s.pos]<<8)|s.buf[s.pos+1];s.pos+=2;return v;}
      case 0xce:{const v=((s.buf[s.pos]<<24)|(s.buf[s.pos+1]<<16)|(s.buf[s.pos+2]<<8)|s.buf[s.pos+3])>>>0;s.pos+=4;return v;}
      case 0xd0:{const v=s.buf[s.pos++];return v>=0x80?v-256:v;}
      case 0xd1:{const v=(s.buf[s.pos]<<8)|s.buf[s.pos+1];s.pos+=2;return v>=0x8000?v-65536:v;}
      case 0xd2:{const v=new DataView(s.buf.buffer,s.buf.byteOffset+s.pos).getInt32(0);s.pos+=4;return v;}
      case 0xd9:return _str(s,s.buf[s.pos++]);
      case 0xda:{const n=(s.buf[s.pos]<<8)|s.buf[s.pos+1];s.pos+=2;return _str(s,n);}
      case 0xdb:{const n=((s.buf[s.pos]<<24)|(s.buf[s.pos+1]<<16)|(s.buf[s.pos+2]<<8)|s.buf[s.pos+3])>>>0;s.pos+=4;return _str(s,n);}
      case 0xdc:{const n=(s.buf[s.pos]<<8)|s.buf[s.pos+1];s.pos+=2;const a=[];for(let i=0;i<n;i++)a.push(_dec(s));return a;}
      case 0xdd:{const n=((s.buf[s.pos]<<24)|(s.buf[s.pos+1]<<16)|(s.buf[s.pos+2]<<8)|s.buf[s.pos+3])>>>0;s.pos+=4;const a=[];for(let i=0;i<n;i++)a.push(_dec(s));return a;}
      case 0xde:{const n=(s.buf[s.pos]<<8)|s.buf[s.pos+1];s.pos+=2;const o={};for(let i=0;i<n;i++){const k=_dec(s);o[k]=_dec(s);}return o;}
      case 0xdf:{const n=((s.buf[s.pos]<<24)|(s.buf[s.pos+1]<<16)|(s.buf[s.pos+2]<<8)|s.buf[s.pos+3])>>>0;s.pos+=4;const o={};for(let i=0;i<n;i++){const k=_dec(s);o[k]=_dec(s);}return o;}
      default:throw new Error("msgpack: unknown byte 0x"+b.toString(16));
    }
  }
  function _str(s,len){const sl=s.buf.subarray(s.pos,s.pos+len);s.pos+=len;return td.decode(sl);}
  return{encode,decode};
})();

// ─── THEME ───────────────────────────────────────────────────────────────────
const THEME_TOKENS=[
  {g:"Backgrounds",key:"--dc-bg-primary",   label:"Primary",    def:"#313338"},
  {g:"Backgrounds",key:"--dc-bg-secondary", label:"Secondary",  def:"#2b2d31"},
  {g:"Backgrounds",key:"--dc-bg-tertiary",  label:"Tertiary",   def:"#1e1f22"},
  {g:"Backgrounds",key:"--dc-bg-floating",  label:"Floating",   def:"#111214"},
  {g:"Accent",     key:"--dc-blurple",      label:"Main",       def:"#5865f2"},
  {g:"Accent",     key:"--dc-blurple-dark", label:"Dark",       def:"#4752c4"},
  {g:"Accent",     key:"--dc-blurple-light",label:"Light",      def:"#7289da"},
  {g:"Status",     key:"--dc-green",        label:"Connected",  def:"#23a55a"},
  {g:"Status",     key:"--dc-red",          label:"Danger",     def:"#f23f43"},
  {g:"Status",     key:"--dc-yellow",       label:"Warning",    def:"#f0b132"},
  {g:"Text",       key:"--dc-text-normal",  label:"Normal",     def:"#dbdee1"},
  {g:"Text",       key:"--dc-text-muted",   label:"Muted",      def:"#949ba4"},
  {g:"Text",       key:"--dc-text-link",    label:"Link",       def:"#00a8fc"},
  {g:"Borders",    key:"--dc-border",       label:"Main",       def:"#1e1f22"},
  {g:"Borders",    key:"--dc-border-subtle",label:"Subtle",     def:"#3f4147"},
  {g:"Borders",    key:"--dc-interactive",  label:"Interactive",def:"#b5bac1"},
];
const THEME_PRESETS={
  "Discord":{},
  "Midnight":{"--dc-bg-primary":"#1a1d2e","--dc-bg-secondary":"#141625","--dc-bg-tertiary":"#0d0e1a","--dc-bg-floating":"#08090f","--dc-blurple":"#4f8ef7","--dc-blurple-dark":"#3a6fd4","--dc-blurple-light":"#7aadff","--dc-green":"#2ecc71","--dc-red":"#e74c3c","--dc-text-normal":"#cdd6f4","--dc-text-muted":"#6c7086","--dc-border":"#181825","--dc-border-subtle":"#313244"},
  "Forest":{"--dc-bg-primary":"#1e2b20","--dc-bg-secondary":"#182019","--dc-bg-tertiary":"#111811","--dc-bg-floating":"#0a0f0a","--dc-blurple":"#4caf50","--dc-blurple-dark":"#388e3c","--dc-blurple-light":"#81c784","--dc-green":"#66bb6a","--dc-red":"#ef5350","--dc-text-normal":"#c8e6c9","--dc-text-muted":"#6a9e6e","--dc-border":"#111811","--dc-border-subtle":"#2e4a30"},
  "Rose Gold":{"--dc-bg-primary":"#2d2022","--dc-bg-secondary":"#251b1d","--dc-bg-tertiary":"#1a1214","--dc-bg-floating":"#120c0e","--dc-blurple":"#e07b8a","--dc-blurple-dark":"#c4566a","--dc-blurple-light":"#f0a8b4","--dc-green":"#68b87e","--dc-red":"#f05050","--dc-text-normal":"#f2dde0","--dc-text-muted":"#9e7880","--dc-border":"#1a1214","--dc-border-subtle":"#4a2d32"},
  "Slate":{"--dc-bg-primary":"#252b37","--dc-bg-secondary":"#1e2330","--dc-bg-tertiary":"#161b27","--dc-bg-floating":"#0f1420","--dc-blurple":"#7c8cf8","--dc-blurple-dark":"#5d6edc","--dc-blurple-light":"#a3aeff","--dc-green":"#34d399","--dc-red":"#f87171","--dc-text-normal":"#e2e8f0","--dc-text-muted":"#64748b","--dc-border":"#161b27","--dc-border-subtle":"#334155"},
  "Catppuccin":{"--dc-bg-primary":"#1e1e2e","--dc-bg-secondary":"#181825","--dc-bg-tertiary":"#11111b","--dc-bg-floating":"#0a0a15","--dc-blurple":"#cba6f7","--dc-blurple-dark":"#b4befe","--dc-blurple-light":"#d4b4fe","--dc-green":"#a6e3a1","--dc-red":"#f38ba8","--dc-text-normal":"#cdd6f4","--dc-text-muted":"#6c7086","--dc-text-link":"#89dceb","--dc-border":"#11111b","--dc-border-subtle":"#313244"},
  "~𝓐𝘚 Clan":{"--dc-bg-primary":"#0e0f1a","--dc-bg-secondary":"#090a14","--dc-bg-tertiary":"#05060e","--dc-bg-floating":"#020308","--dc-blurple":"#7b2fff","--dc-blurple-dark":"#5a1fd4","--dc-blurple-light":"#a76dff","--dc-green":"#00ff88","--dc-red":"#ff2d55","--dc-yellow":"#ffe600","--dc-text-normal":"#e8e6ff","--dc-text-muted":"#5a5880","--dc-text-link":"#7b2fff","--dc-border":"#05060e","--dc-border-subtle":"#1e1a3a","--dc-interactive":"#a76dff"},
  "~𝓐𝘚 Red":{"--dc-bg-primary":"#1a0a0a","--dc-bg-secondary":"#140606","--dc-bg-tertiary":"#0e0303","--dc-bg-floating":"#080101","--dc-blurple":"#ff2d2d","--dc-blurple-dark":"#c41a1a","--dc-blurple-light":"#ff6b6b","--dc-green":"#00ff88","--dc-red":"#ff6600","--dc-yellow":"#ffe600","--dc-text-normal":"#ffe8e8","--dc-text-muted":"#7a4a4a","--dc-text-link":"#ff2d2d","--dc-border":"#0e0303","--dc-border-subtle":"#3a1212","--dc-interactive":"#ff6b6b"},
};
const THEME_SAVE_KEY="noobController_theme",USER_THEMES_KEY="noobController_userThemes",SAVE_KEY="noobController_savedServers",EXPORT_VERSION=1;
const FONT_SAVE_KEY="noobController_font";
const FONT_OPTIONS=[
  {key:"inter",     label:"Inter",       family:"'Inter','Segoe UI',sans-serif"},
  {key:"ubuntu",    label:"Ubuntu",      family:"'Ubuntu',sans-serif"},
  {key:"comicsans", label:"Comic Sans",  family:"'Comic Sans MS','Comic Sans',cursive"},
  {key:"noto",      label:"Noto Sans",   family:"'Noto Sans',sans-serif"},
  {key:"ggsans",    label:"GG Sans",     family:"'GGSans','Inter','Segoe UI',sans-serif"},
  {key:"whitney",   label:"Whitney",     family:"'Whitney','Gill Sans','Gill Sans MT','Calibri','Trebuchet MS',sans-serif"},
];
const loadSavedTheme=()=>{try{return JSON.parse(localStorage.getItem(THEME_SAVE_KEY))||{};}catch{return{};}};
const persistTheme=v=>localStorage.setItem(THEME_SAVE_KEY,JSON.stringify(v));
const applyTheme=v=>{const r=document.documentElement;THEME_TOKENS.forEach(t=>r.style.setProperty(t.key,v[t.key]||t.def));};
const loadSavedFont=()=>localStorage.getItem(FONT_SAVE_KEY)||"inter";
const persistFont=k=>localStorage.setItem(FONT_SAVE_KEY,k);
let _currentFont=loadSavedFont();
const applyFont=k=>{
  _currentFont=k;
  const opt=FONT_OPTIONS.find(f=>f.key===k)||FONT_OPTIONS[0];
  const menu=document.getElementById("scriptMenu");
  if(menu){
    menu.style.setProperty("font-family",opt.family,"important");
    menu.querySelectorAll("*").forEach(el=>el.style.setProperty("font-family",opt.family,"important"));
  }
};
const _initialTheme=loadSavedTheme();
applyTheme(_initialTheme);
// Font is applied after DOM is ready (see bottom of script)

// ─── STYLES ───────────────────────────────────────────────────────────────────
const style=document.createElement("style");
style.textContent=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap');
@font-face{font-family:'GGSans';src:url('https://discord.com/assets/d1ede61e78b2ab4b9af4.woff2') format('woff2');font-weight:400;font-style:normal;}
@font-face{font-family:'GGSans';src:url('https://discord.com/assets/c7dc76b1b14ef01c9328.woff2') format('woff2');font-weight:500;font-style:normal;}
@font-face{font-family:'GGSans';src:url('https://discord.com/assets/a7e90b8ee37cfa3c9f7d.woff2') format('woff2');font-weight:700;font-style:normal;}
:root{--dc-bg-primary:#313338;--dc-bg-secondary:#2b2d31;--dc-bg-tertiary:#1e1f22;--dc-bg-floating:#111214;--dc-blurple:#5865f2;--dc-blurple-dark:#4752c4;--dc-blurple-light:#7289da;--dc-green:#23a55a;--dc-red:#f23f43;--dc-yellow:#f0b132;--dc-text-normal:#dbdee1;--dc-text-muted:#949ba4;--dc-text-link:#00a8fc;--dc-border:#1e1f22;--dc-border-subtle:#3f4147;--dc-interactive:#b5bac1;}
#scriptMenu{font-family:'Inter','Segoe UI',sans-serif!important;background:var(--dc-bg-primary)!important;border:1px solid var(--dc-border)!important;box-shadow:0 8px 16px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4)!important;color:var(--dc-text-normal)!important;}
#scriptMenu p{margin:0!important;display:flex!important;align-items:center!important;gap:10px!important;padding:7px 0!important;border-bottom:1px solid var(--dc-bg-tertiary)!important;}
#scriptMenu p:last-child{border-bottom:none!important;}
#scriptMenu b{font-size:12px!important;letter-spacing:.08em!important;text-transform:uppercase!important;font-weight:700!important;color:var(--dc-text-muted)!important;}
#ncTitleBar{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:8px 2px 12px!important;border-bottom:2px solid var(--dc-bg-tertiary)!important;margin-bottom:12px!important;}
#ncTitleBar span{font-size:18px!important;font-weight:700!important;letter-spacing:.04em!important;color:var(--dc-text-normal)!important;}
#ncStatus{font-size:12px!important;font-weight:600!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:var(--dc-text-muted)!important;display:flex!important;align-items:center!important;gap:5px!important;background:var(--dc-bg-secondary)!important;padding:4px 10px!important;border-radius:10px!important;}
#ncStatus.connected{color:var(--dc-green)!important;background:rgba(35,165,90,.15)!important;}
#serverList{max-height:260px!important;overflow-y:auto!important;padding-right:4px!important;}
#serverList::-webkit-scrollbar{width:4px;}
#serverList::-webkit-scrollbar-track{background:var(--dc-bg-tertiary);border-radius:2px;}
#serverList::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
#serverList::-webkit-scrollbar-thumb:hover{background:var(--dc-blurple);}
#serverList>div{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:9px 12px!important;font-size:14px!important;transition:border-color .15s!important;}
#serverList>div:hover{border-color:var(--dc-blurple)!important;}
#scriptMenu input[type="text"],#scriptMenu input:not([type]),#scriptMenu select,#serverList input{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:15px!important;outline:none!important;transition:border-color .15s!important;}
#scriptMenu input[type="text"]:focus,#scriptMenu input:not([type]):focus,#scriptMenu select:focus,#serverList input:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.3)!important;}
#scriptMenu select option{background:var(--dc-bg-tertiary)!important;}
#botCount{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:16px!important;text-align:center!important;outline:none!important;width:70px!important;}
#scriptMenu input[type="checkbox"]{width:20px!important;height:20px!important;accent-color:var(--dc-blurple)!important;cursor:pointer!important;border:none!important;padding:0!important;}
#scriptMenu button,#serverList button{border:none!important;border-radius:4px!important;font-family:'Inter',sans-serif!important;font-weight:500!important;letter-spacing:.02em!important;cursor:pointer!important;transition:filter .15s,transform .1s,background .15s!important;padding:6px 14px!important;font-size:14px!important;}
#scriptMenu button:hover,#serverList button:hover{filter:brightness(1.1)!important;}
#scriptMenu button:active,#serverList button:active{filter:brightness(.9)!important;transform:scale(.98)!important;}
#addLocal,#addSpace,#reconnectAll,#serverList .btn-connect,#connectNoob,#spawnMulti{background:var(--dc-blurple)!important;color:#fff!important;}
#addLocal:hover,#addSpace:hover,#reconnectAll:hover,#serverList .btn-connect:hover,#connectNoob:hover,#spawnMulti:hover{background:var(--dc-blurple-dark)!important;}
#connectNoob,#spawnMulti{padding:10px 24px!important;font-size:15px!important;border-radius:4px!important;font-weight:600!important;}
#autoRotateBtn,#stayPutBtn,#growthModeBtn{background:var(--dc-bg-secondary)!important;color:var(--dc-text-muted)!important;border:1px solid var(--dc-border-subtle)!important;padding:10px 16px!important;font-size:15px!important;border-radius:4px!important;font-weight:600!important;width:100%!important;letter-spacing:.03em!important;}
#autoRotateBtn.active{background:rgba(88,101,242,.18)!important;color:var(--dc-blurple-light)!important;border-color:var(--dc-blurple)!important;}
#stayPutBtn.active{background:rgba(240,177,50,.18)!important;color:var(--dc-yellow)!important;border-color:var(--dc-yellow)!important;}
#growthModeBtn.active{background:rgba(35,165,90,.18)!important;color:var(--dc-green)!important;border-color:var(--dc-green)!important;}
#autoRotateTimer{font-size:12px!important;color:var(--dc-text-muted)!important;text-align:center!important;padding:3px 0 0!important;display:none!important;}
#autoRotateTimer.visible{display:block!important;}
#deleteNoobs{background:transparent!important;color:var(--dc-red)!important;border:1px solid var(--dc-red)!important;width:100%!important;padding:10px!important;font-size:15px!important;border-radius:4px!important;font-weight:600!important;}
#deleteNoobs:hover{background:rgba(242,63,67,.12)!important;}
#botChatRow{display:flex!important;gap:6px!important;margin-top:6px!important;}
#botChatInput{flex:1!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:14px!important;outline:none!important;transition:border-color .15s!important;}
#botChatInput:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.2)!important;}
#botChatSend{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:7px 13px!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important;white-space:nowrap!important;}
#botChatSend:hover{background:var(--dc-blurple-dark)!important;}
#serverList .btn-remove{background:transparent!important;color:var(--dc-text-muted)!important;border:1px solid var(--dc-border-subtle)!important;padding:5px 10px!important;font-size:13px!important;}
#serverList .btn-remove:hover{background:rgba(242,63,67,.15)!important;color:var(--dc-red)!important;border-color:var(--dc-red)!important;}
#serverList .btn-save{background:transparent!important;color:var(--dc-text-muted)!important;border:1px solid var(--dc-border-subtle)!important;padding:5px 10px!important;font-size:13px!important;}
.cs-label-input{background:transparent!important;border:none!important;border-bottom:1px solid var(--dc-border-subtle)!important;border-radius:0!important;color:var(--dc-blurple-light)!important;font-size:12px!important;font-weight:700!important;letter-spacing:.07em!important;text-transform:uppercase!important;padding:0 2px 2px!important;margin-bottom:6px!important;outline:none!important;width:100%!important;box-shadow:none!important;font-family:'Inter',sans-serif!important;}
.cs-label-input:focus{border-bottom-color:var(--dc-blurple)!important;box-shadow:none!important;}
.cs-label-input::placeholder{color:var(--dc-text-muted)!important;font-weight:400!important;text-transform:none!important;letter-spacing:0!important;}
#scriptMenu hr{border:none!important;border-top:1px solid var(--dc-bg-tertiary)!important;margin:10px 0!important;}
#scriptMenu p>span:first-child,#scriptMenu p>label{color:var(--dc-text-muted)!important;font-size:14px!important;font-weight:500!important;min-width:120px!important;}
#scriptMenu::-webkit-scrollbar{width:4px;}
#scriptMenu::-webkit-scrollbar-track{background:var(--dc-bg-tertiary);}
#scriptMenu::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
#serversCollapsible{overflow:hidden!important;transition:max-height .25s ease,opacity .2s ease!important;max-height:600px!important;opacity:1!important;}
#serversCollapsible.collapsed{max-height:0!important;opacity:0!important;}
#ncCollapseBtn{background:transparent!important;border:none!important;color:var(--dc-text-muted)!important;font-size:14px!important;padding:2px 8px!important;cursor:pointer!important;border-radius:4px!important;line-height:1!important;transition:color .15s,background .15s!important;font-family:'Inter',sans-serif!important;}
#ncCollapseBtn:hover{color:var(--dc-text-normal)!important;background:var(--dc-bg-secondary)!important;filter:none!important;}
.nc-icon-btn{background:transparent!important;border:none!important;color:var(--dc-text-muted)!important;font-size:15px!important;padding:3px 8px!important;cursor:pointer!important;border-radius:4px!important;line-height:1!important;transition:color .15s,background .15s!important;font-family:'Inter',sans-serif!important;}
.nc-icon-btn:hover{color:var(--dc-text-normal)!important;background:var(--dc-bg-secondary)!important;filter:none!important;}
.nc-section-label{font-size:11px!important;font-weight:700!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:var(--dc-text-muted)!important;margin:8px 0 5px!important;display:block!important;font-family:'Inter',sans-serif!important;}
#ncThemePanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;}
#ncThemePanel.open{display:block!important;}
.nc-preset-strip{display:flex!important;gap:4px!important;flex-wrap:wrap!important;margin-bottom:6px!important;}
.nc-preset-pill{font-size:12px!important;padding:4px 12px!important;border-radius:12px!important;border:1px solid var(--dc-border-subtle)!important;background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;transition:all .12s!important;}
.nc-preset-pill:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
.nc-preset-pill.active{background:var(--dc-blurple)!important;color:#fff!important;border-color:var(--dc-blurple)!important;}
.nc-swatch-grid{display:grid!important;grid-template-columns:repeat(8,1fr)!important;gap:6px!important;margin-bottom:4px!important;}
.nc-swatch{display:flex!important;flex-direction:column!important;align-items:center!important;gap:3px!important;}
.nc-swatch-circle{width:30px!important;height:30px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.12)!important;cursor:pointer!important;position:relative!important;overflow:hidden!important;transition:transform .12s!important;}
.nc-swatch-circle:hover{transform:scale(1.15)!important;}
.nc-swatch-circle input[type="color"]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;cursor:pointer!important;border:none!important;padding:0!important;background:none!important;font-size:0!important;}
.nc-swatch-name{font-size:9px!important;color:var(--dc-text-muted)!important;text-align:center!important;line-height:1.1!important;font-family:'Inter',sans-serif!important;}
.nc-theme-save-row{display:flex!important;gap:5px!important;align-items:center!important;margin-top:8px!important;}
.nc-theme-save-row input{flex:1!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:5px 10px!important;font-family:'Inter',sans-serif!important;font-size:13px!important;outline:none!important;min-width:0!important;}
.nc-theme-save-row input:focus{border-color:var(--dc-blurple)!important;}
.nc-theme-btn-sm{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:5px 12px!important;font-size:13px!important;font-family:'Inter',sans-serif!important;cursor:pointer!important;white-space:nowrap!important;font-weight:500!important;}
.nc-theme-btn-sm:hover{filter:brightness(1.1)!important;}
.nc-saved-theme-list{display:flex!important;flex-direction:column!important;gap:3px!important;margin-top:5px!important;max-height:80px!important;overflow-y:auto!important;}
.nc-saved-theme-item{display:flex!important;align-items:center!important;gap:6px!important;background:var(--dc-bg-tertiary)!important;border-radius:4px!important;padding:4px 8px!important;font-size:13px!important;font-family:'Inter',sans-serif!important;color:var(--dc-text-normal)!important;cursor:pointer!important;}
.nc-theme-img-row{margin-top:8px!important;}
.nc-saved-theme-item:hover{filter:brightness(1.1)!important;}
.nc-saved-theme-item span{flex:1!important;}
.nc-saved-theme-thumb{width:28px!important;height:28px!important;border-radius:3px!important;object-fit:cover!important;flex-shrink:0!important;border:1px solid rgba(255,255,255,.12)!important;}
.nc-theme-img-save-row{display:flex!important;gap:5px!important;margin-top:6px!important;}
.nc-saved-theme-del{color:var(--dc-text-muted)!important;cursor:pointer!important;font-size:12px!important;background:none!important;border:none!important;padding:0 2px!important;font-family:'Inter',sans-serif!important;}
.nc-saved-theme-del:hover{color:var(--dc-red)!important;filter:none!important;}
#ncTanksPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:10px!important;margin-bottom:8px!important;display:none;}
#ncTanksPanel.open{display:block!important;}
#ncTanksPanel .te-toolbar{display:flex!important;align-items:center!important;gap:6px!important;margin-bottom:8px!important;flex-wrap:wrap!important;}
#ncTanksPanel select{font-size:13px!important;padding:4px 8px!important;flex:1!important;min-width:0!important;}
#ncTanksPanel textarea{width:100%!important;min-height:200px!important;max-height:280px!important;resize:vertical!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:6px!important;color:var(--dc-text-normal)!important;font-family:'Courier New',monospace!important;font-size:12px!important;line-height:1.55!important;padding:10px!important;outline:none!important;box-sizing:border-box!important;transition:border-color .15s!important;tab-size:2!important;}
#ncTanksPanel textarea:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.2)!important;}
#ncTanksPanel textarea.te-error{border-color:var(--dc-red)!important;box-shadow:0 0 0 2px rgba(242,63,67,.2)!important;}
#ncTanksPanel .te-btn-row{display:flex!important;gap:5px!important;margin-top:7px!important;align-items:center!important;}
#ncTanksPanel .te-status{font-size:12px!important;color:var(--dc-text-muted)!important;flex:1!important;font-family:'Inter',sans-serif!important;}
#ncTanksPanel .te-status.ok{color:var(--dc-green)!important;}
#ncTanksPanel .te-status.err{color:var(--dc-red)!important;}
#ncModsPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;}
#ncModsPanel.open{display:block!important;}
.nc-mod-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important;margin-bottom:4px!important;}
.nc-mod-btn{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:6px!important;color:var(--dc-text-muted)!important;font-family:'Inter',sans-serif!important;font-size:13px!important;font-weight:600!important;padding:9px 6px!important;cursor:pointer!important;text-align:center!important;transition:all .15s!important;line-height:1.4!important;width:100%!important;letter-spacing:0!important;}
.nc-mod-btn:hover{border-color:var(--dc-blurple)!important;color:var(--dc-text-normal)!important;filter:none!important;}
.nc-mod-btn.active{background:rgba(88,101,242,.22)!important;border-color:var(--dc-blurple)!important;color:var(--dc-blurple-light)!important;}
.nc-mod-btn.custom-mod.active{background:rgba(35,165,90,.2)!important;border-color:var(--dc-green)!important;color:var(--dc-green)!important;}
.nc-mod-btn .mod-icon{display:block!important;font-size:20px!important;margin-bottom:2px!important;}
.nc-mod-editor-area{margin-top:8px!important;}
.nc-mod-editor-area textarea{width:100%!important;min-height:130px!important;max-height:220px!important;resize:vertical!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:6px!important;color:var(--dc-text-normal)!important;font-family:'Courier New',monospace!important;font-size:12px!important;line-height:1.55!important;padding:10px!important;outline:none!important;box-sizing:border-box!important;transition:border-color .15s!important;tab-size:2!important;}
.nc-mod-editor-area textarea:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.2)!important;}
.nc-mod-editor-area textarea.mod-err{border-color:var(--dc-red)!important;box-shadow:0 0 0 2px rgba(242,63,67,.2)!important;}
.nc-mod-load-row{display:flex!important;gap:5px!important;margin-top:6px!important;align-items:center!important;}
.nc-mod-status{font-size:12px!important;color:var(--dc-text-muted)!important;flex:1!important;font-family:'Inter',sans-serif!important;}
.nc-mod-status.ok{color:var(--dc-green)!important;}
.nc-mod-status.err{color:var(--dc-red)!important;}
.nc-mod-api-ref{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:6px!important;padding:8px 10px!important;margin-top:8px!important;}
.nc-mod-api-ref summary{font-size:12px!important;font-weight:600!important;color:var(--dc-text-muted)!important;cursor:pointer!important;letter-spacing:.04em!important;font-family:'Inter',sans-serif!important;user-select:none!important;}
.nc-mod-api-ref summary:hover{color:var(--dc-text-normal)!important;}
.nc-mod-api-ref pre{font-family:'Courier New',monospace!important;font-size:11px!important;color:var(--dc-text-muted)!important;margin:7px 0 0!important;white-space:pre-wrap!important;line-height:1.5!important;}
#ncToast{position:fixed!important;bottom:24px!important;left:50%!important;transform:translateX(-50%) translateY(12px)!important;background:var(--dc-bg-floating)!important;border:1px solid var(--dc-border-subtle)!important;color:var(--dc-text-normal)!important;font-family:'Inter',sans-serif!important;font-size:14px!important;padding:10px 20px!important;border-radius:8px!important;z-index:9999!important;pointer-events:none!important;opacity:0!important;transition:opacity .2s,transform .2s!important;}
#ncToast.show{opacity:1!important;transform:translateX(-50%) translateY(0)!important;}

/* ── AI ASSISTANT PANEL ── */
#ncAiPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;flex-direction:column!important;gap:8px!important;}
#ncAiPanel.open{display:flex!important;}
.nc-ai-title{font-size:13px!important;font-weight:700!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;font-family:'Inter',sans-serif!important;margin-bottom:2px!important;}
#ncAiLog{display:flex!important;flex-direction:column!important;gap:7px!important;max-height:280px!important;overflow-y:auto!important;padding-right:2px!important;}
#ncAiLog::-webkit-scrollbar{width:3px!important;}
#ncAiLog::-webkit-scrollbar-track{background:var(--dc-bg-tertiary)!important;}
#ncAiLog::-webkit-scrollbar-thumb{background:var(--dc-border-subtle)!important;border-radius:2px!important;}
.nc-ai-msg{border-radius:6px!important;padding:8px 11px!important;font-size:13px!important;line-height:1.55!important;font-family:'Inter',sans-serif!important;word-break:break-word!important;}
.nc-ai-msg.user{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;color:var(--dc-text-normal)!important;align-self:flex-end!important;max-width:88%!important;}
.nc-ai-msg.bot{background:rgba(88,101,242,.1)!important;border:1px solid rgba(88,101,242,.25)!important;color:var(--dc-text-normal)!important;max-width:97%!important;}
.nc-ai-msg.bot .nc-ai-label{font-size:10px!important;font-weight:700!important;letter-spacing:.07em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;margin-bottom:4px!important;display:block!important;}
.nc-ai-msg code{font-family:'Courier New',monospace!important;font-size:11.5px!important;background:var(--dc-bg-tertiary)!important;padding:1px 5px!important;border-radius:3px!important;color:var(--dc-blurple-light)!important;}
.nc-ai-msg pre{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:5px!important;padding:7px 9px!important;font-family:'Courier New',monospace!important;font-size:11px!important;overflow-x:auto!important;margin:5px 0 0!important;color:var(--dc-text-normal)!important;white-space:pre-wrap!important;}
#ncAiThinking{font-size:12px!important;color:var(--dc-text-muted)!important;font-family:'Inter',sans-serif!important;padding:2px 0!important;}
#ncAiChips{display:flex!important;gap:5px!important;flex-wrap:wrap!important;}
.nc-ai-chip{font-size:11px!important;padding:3px 9px!important;border-radius:10px!important;border:1px solid var(--dc-border-subtle)!important;background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;transition:all .12s!important;}
.nc-ai-chip:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
#ncAiInputRow{display:flex!important;gap:6px!important;align-items:center!important;}
#ncAiInput{flex:1!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:13px!important;outline:none!important;}
#ncAiInput:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.25)!important;}
#ncAiSendBtn{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:7px 14px!important;font-size:13px!important;font-family:'Inter',sans-serif!important;font-weight:500!important;cursor:pointer!important;white-space:nowrap!important;}
#ncAiSendBtn:hover{background:var(--dc-blurple-dark)!important;filter:none!important;}
#ncAiSendBtn:disabled{opacity:.5!important;cursor:not-allowed!important;}

/* ── COMPACT MODE ── */
#ncCompactView{display:none;flex-direction:column;gap:8px;}
#ncCompactView.active{display:flex!important;}
#ncFullView.hidden{display:none!important;}
#ncCompactStatus{font-size:12px!important;font-weight:600!important;color:var(--dc-text-muted)!important;display:flex!important;align-items:center!important;gap:6px!important;background:var(--dc-bg-secondary)!important;padding:4px 10px!important;border-radius:10px!important;}
#ncCompactStatus.connected{color:var(--dc-green)!important;background:rgba(35,165,90,.15)!important;}
.nc-compact-label{color:var(--dc-text-muted)!important;font-size:13px!important;font-weight:500!important;min-width:90px!important;}
.nc-compact-row{display:flex!important;align-items:center!important;gap:8px!important;}
#ncCompactReconnect{background:var(--dc-bg-secondary)!important;color:var(--dc-text-muted)!important;border:1px solid var(--dc-border-subtle)!important;padding:7px 12px!important;font-size:13px!important;border-radius:4px!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;white-space:nowrap!important;}
#ncCompactReconnect:hover{border-color:var(--dc-blurple)!important;color:var(--dc-text-normal)!important;filter:none!important;}
#ncCompactConnect{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:8px 14px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;}
#ncCompactSpawn{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:8px 14px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;}
#ncCompactConnect:hover,#ncCompactSpawn:hover{background:var(--dc-blurple-dark)!important;filter:none!important;}
#ncCompactKill{background:transparent!important;color:var(--dc-red)!important;border:1px solid var(--dc-red)!important;border-radius:4px!important;padding:8px 14px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;}
#ncCompactKill:hover{background:rgba(242,63,67,.12)!important;filter:none!important;}
#ncCompactCount{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:15px!important;text-align:center!important;outline:none!important;width:64px!important;}
.nc-compact-divider{border:none!important;border-top:1px solid var(--dc-bg-tertiary)!important;margin:2px 0!important;}
#ncCompactView select{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:14px!important;outline:none!important;flex:1!important;}
#ncCompactView input:not([type="number"]){background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:7px 10px!important;font-family:'Inter',sans-serif!important;font-size:14px!important;outline:none!important;flex:1!important;}

/* ── COMPACT TOGGLE BUTTON ── */
#ncCompactBtn{background:transparent!important;border:1px solid var(--dc-border-subtle)!important;color:var(--dc-text-muted)!important;font-size:13px!important;padding:3px 9px!important;cursor:pointer!important;border-radius:4px!important;line-height:1.4!important;transition:color .15s,background .15s,border-color .15s!important;font-family:'Inter',sans-serif!important;white-space:nowrap!important;}
#ncCompactBtn:hover{color:var(--dc-text-normal)!important;background:var(--dc-bg-secondary)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
#ncCompactBtn.active{background:rgba(88,101,242,.18)!important;color:var(--dc-blurple-light)!important;border-color:var(--dc-blurple)!important;}

/* ── COMMAND PROMPT ── */
#ncCmdPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:0!important;margin-bottom:8px!important;display:none;overflow:hidden!important;}
#ncCmdPanel.open{display:block!important;}
#ncCmdLog{max-height:180px!important;overflow-y:auto!important;padding:10px 12px!important;display:flex!important;flex-direction:column!important;gap:3px!important;font-family:'Courier New',monospace!important;}
#ncCmdLog::-webkit-scrollbar{width:3px;}
#ncCmdLog::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
.nc-cmd-line{font-size:12px!important;line-height:1.5!important;font-family:'Courier New',monospace!important;white-space:pre-wrap!important;word-break:break-all!important;}
.nc-cmd-info{color:var(--dc-text-muted)!important;}
.nc-cmd-ok{color:var(--dc-green)!important;}
.nc-cmd-err{color:var(--dc-red)!important;}
.nc-cmd-sys{color:var(--dc-blurple-light)!important;}
.nc-cmd-echo{color:var(--dc-text-normal)!important;}
#ncCmdInputRow{display:flex!important;align-items:center!important;border-top:1px solid var(--dc-border)!important;padding:7px 10px!important;gap:6px!important;background:var(--dc-bg-tertiary)!important;}
#ncCmdPromptLabel{font-size:13px!important;color:var(--dc-blurple-light)!important;font-family:'Courier New',monospace!important;white-space:nowrap!important;user-select:none!important;}
#ncCmdInput{flex:1!important;background:transparent!important;border:none!important;outline:none!important;font-family:'Courier New',monospace!important;font-size:13px!important;color:var(--dc-text-normal)!important;caret-color:var(--dc-blurple)!important;padding:0!important;}
#ncCmdInput::placeholder{color:var(--dc-text-muted)!important;}
#ncCmdRunBtn{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:4px 12px!important;font-size:12px!important;font-family:'Courier New',monospace!important;cursor:pointer!important;white-space:nowrap!important;}
#ncCmdRunBtn:hover{background:var(--dc-blurple-dark)!important;filter:none!important;}

/* ── HELP PANEL ── */
#ncHelpPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;overflow:hidden!important;}
#ncHelpPanel.open{display:block!important;}
.nc-help-section{margin-bottom:10px!important;}
.nc-help-section:last-child{margin-bottom:0!important;}
.nc-help-title{font-size:11px!important;font-weight:700!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;margin-bottom:6px!important;font-family:'Inter',sans-serif!important;}
.nc-help-row{display:flex!important;align-items:baseline!important;gap:8px!important;padding:4px 0!important;border-bottom:1px solid var(--dc-bg-tertiary)!important;}
.nc-help-row:last-child{border-bottom:none!important;}
.nc-help-cmd{font-family:'Courier New',monospace!important;font-size:12px!important;color:var(--dc-text-normal)!important;white-space:nowrap!important;min-width:200px!important;}
.nc-help-desc{font-size:12px!important;color:var(--dc-text-muted)!important;flex:1!important;font-family:'Inter',sans-serif!important;}
.nc-help-aliases{display:flex!important;flex-wrap:wrap!important;gap:3px!important;margin-top:4px!important;}
.nc-help-alias{font-family:'Courier New',monospace!important;font-size:11px!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:3px!important;padding:2px 6px!important;color:var(--dc-text-muted)!important;}

/* ── CODESPACE GUIDE PANEL ── */
#ncGuidePanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;overflow:hidden!important;}
#ncGuidePanel.open{display:block!important;}
.nc-guide-step{display:flex!important;gap:10px!important;padding:8px 0!important;border-bottom:1px solid var(--dc-bg-tertiary)!important;align-items:flex-start!important;}
.nc-guide-step:last-child{border-bottom:none!important;}
.nc-guide-num{min-width:24px!important;height:24px!important;border-radius:50%!important;background:var(--dc-blurple)!important;color:#fff!important;font-size:12px!important;font-weight:700!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;margin-top:1px!important;font-family:'Inter',sans-serif!important;}
.nc-guide-body{flex:1!important;}
.nc-guide-title{font-size:14px!important;font-weight:600!important;color:var(--dc-text-normal)!important;margin-bottom:2px!important;font-family:'Inter',sans-serif!important;}
.nc-guide-desc{font-size:13px!important;color:var(--dc-text-muted)!important;line-height:1.5!important;font-family:'Inter',sans-serif!important;}
.nc-guide-code{background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;padding:6px 10px!important;font-family:'Courier New',monospace!important;font-size:12px!important;color:var(--dc-text-normal)!important;margin-top:5px!important;word-break:break-all!important;line-height:1.6!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;}
.nc-guide-code span{flex:1!important;}
.nc-guide-copy{background:transparent!important;border:1px solid var(--dc-border-subtle)!important;border-radius:3px!important;color:var(--dc-text-muted)!important;font-size:11px!important;padding:2px 7px!important;cursor:pointer!important;flex-shrink:0!important;font-family:'Inter',sans-serif!important;}
.nc-guide-copy:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
.nc-guide-note{background:rgba(88,101,242,.1)!important;border-left:2px solid var(--dc-blurple)!important;border-radius:0 4px 4px 0!important;padding:5px 10px!important;font-size:12px!important;color:var(--dc-blurple-light)!important;margin-top:5px!important;line-height:1.5!important;font-family:'Inter',sans-serif!important;}
.nc-guide-warn{background:rgba(242,63,67,.1)!important;border-left:2px solid var(--dc-red)!important;border-radius:0 4px 4px 0!important;padding:5px 10px!important;font-size:12px!important;color:var(--dc-red)!important;margin-top:5px!important;line-height:1.5!important;font-family:'Inter',sans-serif!important;}
.nc-guide-section-header{font-size:11px!important;font-weight:700!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;margin:10px 0 4px!important;font-family:'Inter',sans-serif!important;}
.nc-guide-url-convert{display:flex!important;align-items:center!important;gap:6px!important;margin-top:6px!important;flex-wrap:wrap!important;}
.nc-guide-url-convert input{flex:1!important;min-width:120px!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:6px 10px!important;font-family:'Courier New',monospace!important;font-size:12px!important;outline:none!important;}
.nc-guide-url-convert input:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.3)!important;}
.nc-guide-url-result{font-family:'Courier New',monospace!important;font-size:12px!important;color:var(--dc-green)!important;word-break:break-all!important;padding:5px 10px!important;background:rgba(35,165,90,.08)!important;border:1px solid rgba(35,165,90,.3)!important;border-radius:4px!important;margin-top:4px!important;display:none!important;}
.nc-guide-url-result.visible{display:block!important;}

/* ── MEDIA PLAYER PANEL ── */
#ncMediaPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;overflow:hidden!important;}
#ncMediaPanel.open{display:block!important;}
.nc-media-title{font-size:11px!important;font-weight:700!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;margin-bottom:8px!important;font-family:'Inter',sans-serif!important;}
.nc-media-url-row{display:flex!important;gap:5px!important;margin-bottom:8px!important;}
.nc-media-url-row input{flex:1!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-normal)!important;padding:6px 10px!important;font-family:'Inter',sans-serif!important;font-size:13px!important;outline:none!important;}
.nc-media-url-row input:focus{border-color:var(--dc-blurple)!important;box-shadow:0 0 0 2px rgba(88,101,242,.3)!important;}
.nc-media-url-row input::placeholder{color:var(--dc-text-muted)!important;}
.nc-media-load-btn{background:var(--dc-blurple)!important;color:#fff!important;border:none!important;border-radius:4px!important;padding:6px 14px!important;font-size:13px!important;font-family:'Inter',sans-serif!important;cursor:pointer!important;white-space:nowrap!important;font-weight:500!important;}
.nc-media-load-btn:hover{background:var(--dc-blurple-dark)!important;filter:none!important;}
#ncMediaPlayer{width:100%!important;border-radius:6px!important;background:#000!important;display:none;margin-bottom:8px!important;max-height:220px!important;}
#ncMediaPlayer.visible{display:block!important;}
#ncMediaAudio{width:100%!important;display:none;margin-bottom:8px!important;}
#ncMediaAudio.visible{display:block!important;}
.nc-media-controls{display:flex!important;align-items:center!important;gap:7px!important;background:var(--dc-bg-tertiary)!important;border-radius:6px!important;padding:8px 10px!important;}
.nc-media-ctrl-btn{background:transparent!important;border:1px solid var(--dc-border-subtle)!important;color:var(--dc-text-muted)!important;border-radius:4px!important;padding:5px 10px!important;font-size:16px!important;cursor:pointer!important;line-height:1!important;transition:color .15s,border-color .15s!important;font-family:'Inter',sans-serif!important;}
.nc-media-ctrl-btn:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
#ncMediaSeek{flex:1!important;accent-color:var(--dc-blurple)!important;cursor:pointer!important;height:4px!important;border:none!important;padding:0!important;background:none!important;min-width:0!important;}
#ncMediaVolume{width:64px!important;accent-color:var(--dc-blurple)!important;cursor:pointer!important;height:4px!important;border:none!important;padding:0!important;background:none!important;}
#ncMediaTime{font-size:11px!important;color:var(--dc-text-muted)!important;font-family:'Courier New',monospace!important;white-space:nowrap!important;min-width:80px!important;text-align:right!important;}
.nc-media-status{font-size:12px!important;color:var(--dc-text-muted)!important;margin-top:6px!important;font-family:'Inter',sans-serif!important;min-height:16px!important;word-break:break-all!important;}
.nc-media-status.ok{color:var(--dc-green)!important;}
.nc-media-status.err{color:var(--dc-red)!important;}
.nc-media-presets{display:flex!important;flex-wrap:wrap!important;gap:4px!important;margin-bottom:8px!important;}
.nc-media-preset-pill{font-size:11px!important;padding:3px 10px!important;border-radius:12px!important;border:1px solid var(--dc-border-subtle)!important;background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;transition:all .12s!important;white-space:nowrap!important;}
.nc-media-preset-pill:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
/* ── LAYOUT EDITOR ── */
#ncLayoutPanel{background:var(--dc-bg-secondary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:8px!important;padding:12px!important;margin-bottom:8px!important;display:none;}
#ncLayoutPanel.open{display:block!important;}
.nc-layout-title{font-size:11px!important;font-weight:700!important;letter-spacing:.1em!important;text-transform:uppercase!important;color:var(--dc-blurple-light)!important;margin-bottom:8px!important;font-family:'Inter',sans-serif!important;}
.nc-layout-desc{font-size:12px!important;color:var(--dc-text-muted)!important;margin-bottom:10px!important;font-family:'Inter',sans-serif!important;line-height:1.5!important;}
#ncLayoutList{display:flex!important;flex-direction:column!important;gap:5px!important;margin-bottom:10px!important;}
.nc-layout-item{display:flex!important;align-items:center!important;gap:8px!important;background:var(--dc-bg-tertiary)!important;border:1px solid var(--dc-border-subtle)!important;border-radius:6px!important;padding:8px 10px!important;cursor:grab!important;user-select:none!important;transition:border-color .15s,background .15s!important;}
.nc-layout-item:active{cursor:grabbing!important;}
.nc-layout-item.dragging{opacity:.4!important;border-color:var(--dc-blurple)!important;}
.nc-layout-item.drag-over{border-color:var(--dc-blurple)!important;background:rgba(88,101,242,.12)!important;}
.nc-layout-handle{color:var(--dc-text-muted)!important;font-size:16px!important;line-height:1!important;flex-shrink:0!important;}
.nc-layout-icon{font-size:15px!important;flex-shrink:0!important;}
.nc-layout-name{flex:1!important;font-size:13px!important;font-weight:500!important;color:var(--dc-text-normal)!important;font-family:'Inter',sans-serif!important;}
.nc-layout-toggle{background:transparent!important;border:1px solid var(--dc-border-subtle)!important;border-radius:4px!important;color:var(--dc-text-muted)!important;font-size:11px!important;padding:2px 8px!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;transition:all .12s!important;}
.nc-layout-toggle:hover{border-color:var(--dc-blurple)!important;color:var(--dc-text-normal)!important;filter:none!important;}
.nc-layout-toggle.hidden-section{color:var(--dc-red)!important;border-color:var(--dc-red)!important;}
.nc-layout-width-row{display:flex!important;align-items:center!important;gap:10px!important;margin-bottom:8px!important;}
.nc-layout-width-row label{font-size:12px!important;color:var(--dc-text-muted)!important;font-family:'Inter',sans-serif!important;min-width:90px!important;}
#ncLayoutWidthSlider{flex:1!important;accent-color:var(--dc-blurple)!important;cursor:pointer!important;border:none!important;padding:0!important;background:none!important;}
#ncLayoutWidthVal{font-size:12px!important;color:var(--dc-text-normal)!important;font-family:'Courier New',monospace!important;min-width:44px!important;text-align:right!important;}
.nc-layout-opacity-row{display:flex!important;align-items:center!important;gap:10px!important;margin-bottom:10px!important;}
.nc-layout-opacity-row label{font-size:12px!important;color:var(--dc-text-muted)!important;font-family:'Inter',sans-serif!important;min-width:90px!important;}
#ncLayoutOpacitySlider{flex:1!important;accent-color:var(--dc-blurple)!important;cursor:pointer!important;border:none!important;padding:0!important;background:none!important;}
#ncLayoutOpacityVal{font-size:12px!important;color:var(--dc-text-normal)!important;font-family:'Courier New',monospace!important;min-width:44px!important;text-align:right!important;}
.nc-layout-btn-row{display:flex!important;gap:6px!important;flex-wrap:wrap!important;}
.nc-layout-action-btn{font-size:12px!important;padding:5px 12px!important;border-radius:4px!important;border:1px solid var(--dc-border-subtle)!important;background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;cursor:pointer!important;font-family:'Inter',sans-serif!important;transition:all .12s!important;}
.nc-layout-action-btn:hover{color:var(--dc-text-normal)!important;border-color:var(--dc-blurple)!important;filter:none!important;}
.nc-layout-action-btn.primary{background:var(--dc-blurple)!important;color:#fff!important;border-color:var(--dc-blurple)!important;}
.nc-layout-action-btn.primary:hover{background:var(--dc-blurple-dark)!important;filter:none!important;}
.nc-layout-action-btn.danger{color:var(--dc-red)!important;border-color:var(--dc-red)!important;}
.nc-layout-action-btn.danger:hover{background:rgba(242,63,67,.12)!important;filter:none!important;}
`;
document.head.appendChild(style);

// ─── TOAST ────────────────────────────────────────────────────────────────────
const toast=document.createElement("div");toast.id="ncToast";document.body.appendChild(toast);
let toastTimer=null;
function showToast(msg,isError=false){
  toast.textContent=msg;
  toast.style.borderColor=isError?"var(--dc-red)":"var(--dc-border-subtle)";
  toast.classList.add("show");clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}

// ─── ACCOUNT SYSTEM ───────────────────────────────────────────────────────────
// Roles: owner | beta | free | demo
// owner      → full access + account manager + role assignment
// beta       → all features + can submit suggestions to owner
// free       → music, codespace guide, bots only (no themes/mods/layout/AI/cmd/tank editor/export/import)
// demo       → can see the full free user UI but ALL buttons/inputs are disabled (view only tour)

const NC_ACCOUNTS_KEY="noobController_accounts_v4";
const NC_SUGGESTIONS_KEY="noobController_suggestions";

// ─── PASSWORD HASHING (SHA-256 via Web Crypto) ───────────────────────────────
async function ncHashPassword(plain){
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(plain));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function ncLoadAccounts(){
  try{const a=JSON.parse(localStorage.getItem(NC_ACCOUNTS_KEY));if(Array.isArray(a)&&a.length)return a;}catch{}
  // Default seed — passwords are SHA-256 hashes
  return [
    {username:"simplyspringwhy123",password:"cd6d38e77e5265f349228b623ad7009fdcdb2dc1f2263b72ba16df6398f2fe52",role:"owner",displayName:"simplyspringwhy"},
    {username:"NotDerox99",        password:"baf8af069bb15099d8d6d8b6203b2e77baccd6d35e9d7f080758841506a737e0",role:"beta"},
    {username:"Pancaker7777",      password:"1a543dd328f45926575bf23eb20405b9ffb4eb67aee9422d2c98d8e26b78093d",role:"demo",displayName:"7777"},
    {username:"DeluxeWolf0000",    password:"b63730bc2528102976de82992da49358aa994f4fcd5635a01990e7b0f4293171",role:"beta",displayName:"Lone_Wolf - Deluxe"},
    {username:"SuroSausage11",     password:"2a644e752f0b9456b8c6476e44b63c19329a2ee8718f550de9f4bbeca0ef27de",role:"beta",displayName:"Sausage"},
  ];
}
function ncSaveAccounts(arr){localStorage.setItem(NC_ACCOUNTS_KEY,JSON.stringify(arr));}
let NC_ACCOUNTS=ncLoadAccounts();

const NC_ROLE_COLORS={owner:"#f0b132",beta:"#5865f2",free:"#23a55a",demo:"#e07b8a"};
const NC_ROLE_BADGES={owner:"👑 Owner",beta:"🧪 Beta Tester",free:"🆓 Free User",demo:"🎮 Demo Noob"};
const NC_ROLE_LABELS={owner:"Owner",beta:"Beta Tester",free:"Free User",demo:"Demo Noob"};

// What each role can see/use (button IDs + panel IDs locked for non-permitted roles)
const NC_ROLE_PERMS={
  owner:{all:true},
  beta:{all:true},  // beta gets full feature access
  free:{
    allowed:new Set([
      "ncGuideBtn","ncMediaBtn","ncGuidePanel","ncMediaPanel",
      // bot controls section always visible
      "_botcontrols","_servers","ncCompactBtn","ncCompactView"
    ])
  }
};

// Buttons/panels that free users can NOT access
const NC_FREE_LOCKED_BTNS=["ncExportBtn","ncImportBtn","ncThemeBtn","ncModsBtn","ncHelpBtn","ncLayoutBtn","ncAiBtn","ncCmdBtn"];
const NC_FREE_LOCKED_PANELS=["ncThemePanel","ncModsPanel","ncHelpPanel","ncLayoutPanel","ncAiPanel","ncCmdPanel","ncTanksPanel"];

const NC_SESSION_KEY="noobController_session";
const NC_PENDING_KEY="noobController_pendingAccounts";

// ── Pending account helpers ──
function ncLoadPending(){try{const a=JSON.parse(localStorage.getItem(NC_PENDING_KEY));return Array.isArray(a)?a:[];}catch{return[];}}
function ncSavePending(arr){localStorage.setItem(NC_PENDING_KEY,JSON.stringify(arr));}
function ncPendingCount(){return ncLoadPending().length;}

function ncSaveSession(username){localStorage.setItem(NC_SESSION_KEY,username);}
function ncClearSession(){localStorage.removeItem(NC_SESSION_KEY);}
function ncGetSession(){return localStorage.getItem(NC_SESSION_KEY);}
async function ncFindAccount(username,password){
  const hashed=await ncHashPassword(password);
  return NC_ACCOUNTS.find(a=>a.username===username&&a.password===hashed)||null;
}
function ncFindByUsername(username){
  return NC_ACCOUNTS.find(a=>a.username===username)||null;
}

// ── Login overlay + role UI styles ──
const ncLoginStyle=document.createElement("style");
ncLoginStyle.textContent=`
#ncLoginOverlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.72);z-index:8888;display:flex;align-items:center;justify-content:center;font-family:'Inter','Segoe UI',sans-serif;}
#ncLoginBox{background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:12px;padding:32px 36px;width:360px;box-shadow:0 16px 40px rgba(0,0,0,.7);box-sizing:border-box;}
#ncLoginBox h2{margin:0 0 6px;font-size:22px;font-weight:700;color:var(--dc-text-normal);letter-spacing:.03em;}
#ncLoginBox .nc-login-sub{font-size:13px;color:var(--dc-text-muted);margin-bottom:22px;}
.nc-login-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
.nc-login-field label{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dc-text-muted);}
.nc-login-field input{background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:5px;color:var(--dc-text-normal);padding:9px 12px;font-family:'Inter',sans-serif;font-size:15px;outline:none;transition:border-color .15s;}
.nc-login-field input:focus{border-color:var(--dc-blurple);box-shadow:0 0 0 2px rgba(88,101,242,.25);}
#ncLoginBtn{width:100%;background:var(--dc-blurple);color:#fff;border:none;border-radius:5px;padding:11px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;margin-top:4px;transition:background .15s;}
#ncLoginBtn:hover{background:var(--dc-blurple-dark);}
#ncLoginErr{color:var(--dc-red);font-size:13px;margin-top:10px;min-height:18px;text-align:center;}
#ncLoginFooter{font-size:11px;color:var(--dc-text-muted);text-align:center;margin-top:16px;}
#ncUserBadge{display:flex;align-items:center;gap:7px;background:var(--dc-bg-secondary);border:1px solid var(--dc-border-subtle);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--dc-text-muted);cursor:default;user-select:none;}
#ncUserBadge .nc-badge-role{font-size:11px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:6px;}
#ncLogoutBtn{background:transparent;border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-text-muted);font-size:11px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;margin-left:2px;transition:all .12s;}
#ncLogoutBtn:hover{color:var(--dc-red);border-color:var(--dc-red);filter:none!important;}
/* ── Owner Panel ── */
#ncOwnerPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:480px;max-height:85vh;overflow-y:auto;background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:12px;padding:22px 24px;z-index:9000;box-shadow:0 16px 48px rgba(0,0,0,.8);font-family:'Inter',sans-serif;display:none;box-sizing:border-box;}
#ncOwnerPanel.open{display:block!important;}
.nc-op-title{font-size:16px;font-weight:700;color:var(--dc-text-normal);letter-spacing:.03em;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;}
.nc-op-close{background:transparent;border:none;color:var(--dc-text-muted);font-size:18px;cursor:pointer;padding:0;line-height:1;}
.nc-op-close:hover{color:var(--dc-red);}
.nc-op-section{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dc-blurple-light);margin:14px 0 8px;}
#ncOpAccountList{max-height:220px;overflow-y:auto;padding-right:4px;margin-bottom:6px;}
#ncOpAccountList::-webkit-scrollbar{width:4px;}
#ncOpAccountList::-webkit-scrollbar-track{background:var(--dc-bg-tertiary);border-radius:2px;}
#ncOpAccountList::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
#ncOpAccountList::-webkit-scrollbar-thumb:hover{background:var(--dc-blurple);}
.nc-op-account-row{display:flex;align-items:center;gap:8px;background:var(--dc-bg-secondary);border:1px solid var(--dc-border-subtle);border-radius:7px;padding:8px 12px;margin-bottom:6px;}
.nc-op-acc-name{flex:1;font-size:13px;font-weight:600;color:var(--dc-text-normal);}
.nc-op-acc-role{font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;letter-spacing:.04em;}
.nc-op-role-select{background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-text-normal);padding:4px 7px;font-size:12px;font-family:'Inter',sans-serif;outline:none;cursor:pointer;}
.nc-op-reset-btn{background:transparent;border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-yellow);font-size:12px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-op-reset-btn:hover{background:rgba(240,177,50,.12);filter:none!important;}
.nc-op-del-btn{background:transparent;border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-red);font-size:12px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-op-del-btn:hover{background:rgba(242,63,67,.12);filter:none!important;}
.nc-op-add-form{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:4px;}
.nc-op-add-form input,.nc-op-add-form select{background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-text-normal);padding:7px 10px;font-family:'Inter',sans-serif;font-size:13px;outline:none;grid-column:span 1;}
.nc-op-add-form input:focus,.nc-op-add-form select:focus{border-color:var(--dc-blurple);}
.nc-op-add-btn{grid-column:span 2;background:var(--dc-blurple);color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;margin-top:2px;}
.nc-op-add-btn:hover{background:var(--dc-blurple-dark);filter:none!important;}
.nc-op-msg{font-size:12px;margin-top:6px;min-height:16px;grid-column:span 2;}
.nc-op-msg.ok{color:var(--dc-green);}
.nc-op-msg.err{color:var(--dc-red);}
/* ── Suggestion Box ── */
#ncSuggestPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:12px;padding:22px 24px;z-index:9000;box-shadow:0 16px 48px rgba(0,0,0,.8);font-family:'Inter',sans-serif;display:none;box-sizing:border-box;}
#ncSuggestPanel.open{display:block!important;}
.nc-suggest-title{font-size:15px;font-weight:700;color:var(--dc-text-normal);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
#ncSuggestInput{width:100%;min-height:90px;background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:5px;color:var(--dc-text-normal);padding:9px 12px;font-family:'Inter',sans-serif;font-size:13px;outline:none;resize:vertical;box-sizing:border-box;transition:border-color .15s;}
#ncSuggestInput:focus{border-color:var(--dc-blurple);box-shadow:0 0 0 2px rgba(88,101,242,.25);}
#ncSuggestSend{width:100%;background:var(--dc-blurple);color:#fff;border:none;border-radius:4px;padding:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;margin-top:8px;}
#ncSuggestSend:hover{background:var(--dc-blurple-dark);filter:none!important;}
#ncSuggestMsg{font-size:12px;margin-top:7px;min-height:16px;text-align:center;}
/* owner suggestion inbox */
.nc-suggest-inbox-item{background:var(--dc-bg-secondary);border:1px solid var(--dc-border-subtle);border-radius:7px;padding:9px 12px;margin-bottom:7px;}
.nc-suggest-inbox-from{font-size:11px;color:var(--dc-blurple-light);font-weight:700;margin-bottom:4px;}
.nc-suggest-inbox-text{font-size:13px;color:var(--dc-text-normal);line-height:1.5;}
.nc-suggest-inbox-empty{font-size:13px;color:var(--dc-text-muted);text-align:center;padding:16px 0;}
/* ── Global Chat ── */
#ncChatPanel{position:fixed;bottom:24px;right:24px;width:340px;max-height:500px;background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:12px;padding:0;z-index:9100;box-shadow:0 16px 48px rgba(0,0,0,.8);font-family:'Inter',sans-serif;display:none;flex-direction:column;box-sizing:border-box;overflow:hidden;}
#ncChatPanel.open{display:flex!important;}
.nc-chat-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--dc-border-subtle);flex-shrink:0;}
.nc-chat-header-left{display:flex;align-items:center;gap:8px;}
.nc-chat-title{font-size:14px;font-weight:700;color:var(--dc-text-normal);letter-spacing:.02em;}
.nc-chat-online{font-size:11px;font-weight:600;color:var(--dc-green);background:rgba(35,165,90,.12);border-radius:8px;padding:2px 7px;}
.nc-chat-close{background:transparent;border:none;color:var(--dc-text-muted);font-size:16px;cursor:pointer;padding:0;line-height:1;transition:color .12s;}
.nc-chat-close:hover{color:var(--dc-red);}
#ncChatLog{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:6px;min-height:0;}
#ncChatLog::-webkit-scrollbar{width:4px;}
#ncChatLog::-webkit-scrollbar-track{background:var(--dc-bg-tertiary);border-radius:2px;}
#ncChatLog::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
#ncChatLog::-webkit-scrollbar-thumb:hover{background:var(--dc-blurple);}
.nc-chat-msg{display:flex;flex-direction:column;gap:2px;}
.nc-chat-msg-header{display:flex;align-items:center;gap:6px;}
.nc-chat-msg-name{font-size:12px;font-weight:700;}
.nc-chat-msg-role{font-size:10px;font-weight:700;letter-spacing:.05em;padding:1px 5px;border-radius:4px;}
.nc-chat-msg-time{font-size:10px;color:var(--dc-text-muted);margin-left:auto;}
.nc-chat-msg-text{font-size:13px;color:var(--dc-text-normal);line-height:1.5;word-break:break-word;padding-left:2px;}
.nc-chat-msg.own .nc-chat-msg-text{color:var(--dc-text-normal);}
.nc-chat-system{font-size:11px;color:var(--dc-text-muted);text-align:center;padding:4px 0;font-style:italic;}
.nc-chat-empty{font-size:13px;color:var(--dc-text-muted);text-align:center;padding:24px 0;}
.nc-chat-input-row{display:flex;gap:7px;padding:10px 12px;border-top:1px solid var(--dc-border-subtle);flex-shrink:0;}
#ncChatInput{flex:1;background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:6px;color:var(--dc-text-normal);padding:7px 10px;font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:border-color .15s;}
#ncChatInput:focus{border-color:var(--dc-blurple);box-shadow:0 0 0 2px rgba(88,101,242,.2);}
#ncChatSendBtn{background:var(--dc-blurple);color:#fff;border:none;border-radius:6px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .12s;white-space:nowrap;}
#ncChatSendBtn:hover{background:var(--dc-blurple-dark);filter:none!important;}
#ncChatUnread{position:absolute;top:-4px;right:-4px;background:var(--dc-red);color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:none;align-items:center;justify-content:center;font-family:'Inter',sans-serif;}
#ncChatUnread.visible{display:flex;}
.nc-chat-btn-wrap{position:relative;display:inline-flex;}
/* ── Register / Create Account ── */
#ncRegisterBox{background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:12px;padding:28px 32px;width:400px;max-height:90vh;overflow-y:auto;box-shadow:0 16px 40px rgba(0,0,0,.7);box-sizing:border-box;font-family:'Inter','Segoe UI',sans-serif;}
#ncRegisterBox h2{margin:0 0 4px;font-size:20px;font-weight:700;color:var(--dc-text-normal);letter-spacing:.03em;}
#ncRegisterBox .nc-reg-sub{font-size:12px;color:var(--dc-text-muted);margin-bottom:20px;}
.nc-reg-field{display:flex;flex-direction:column;gap:5px;margin-bottom:13px;}
.nc-reg-field label{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dc-text-muted);}
.nc-reg-field input{background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:5px;color:var(--dc-text-normal);padding:9px 12px;font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:border-color .15s;}
.nc-reg-field input:focus{border-color:var(--dc-blurple);box-shadow:0 0 0 2px rgba(88,101,242,.25);}
.nc-reg-field input.err{border-color:var(--dc-red)!important;}
#ncRegTosBox{background:var(--dc-bg-secondary);border:1px solid var(--dc-border-subtle);border-radius:8px;padding:12px 14px;margin-bottom:14px;max-height:130px;overflow-y:auto;font-size:12px;color:var(--dc-text-muted);line-height:1.7;}
#ncRegTosBox::-webkit-scrollbar{width:4px;}
#ncRegTosBox::-webkit-scrollbar-thumb{background:var(--dc-border-subtle);border-radius:2px;}
#ncRegTosBox strong{color:var(--dc-text-normal);}
.nc-reg-tos-row{display:flex;align-items:flex-start;gap:9px;margin-bottom:14px;}
.nc-reg-tos-row input[type="checkbox"]{width:16px;height:16px;flex-shrink:0;margin-top:2px;accent-color:var(--dc-blurple);}
.nc-reg-tos-row label{font-size:12px;color:var(--dc-text-muted);line-height:1.5;cursor:pointer;}
.nc-reg-tos-row label span{color:var(--dc-blurple-light);}
#ncRegSubmitBtn{width:100%;background:var(--dc-blurple);color:#fff;border:none;border-radius:5px;padding:11px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s;}
#ncRegSubmitBtn:hover{background:var(--dc-blurple-dark);}
#ncRegSubmitBtn:disabled{opacity:.5;cursor:not-allowed;}
#ncRegErr{color:var(--dc-red);font-size:13px;margin-top:10px;min-height:18px;text-align:center;}
#ncRegBackBtn{width:100%;background:transparent;color:var(--dc-text-muted);border:1px solid var(--dc-border-subtle);border-radius:5px;padding:9px;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;margin-top:8px;transition:all .15s;}
#ncRegBackBtn:hover{color:var(--dc-text-normal);border-color:var(--dc-blurple);}
#ncRegCreateBtn{width:100%;background:transparent;color:var(--dc-text-muted);border:1px solid var(--dc-border-subtle);border-radius:5px;padding:9px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;margin-top:8px;transition:all .15s;}
#ncRegCreateBtn:hover{color:var(--dc-text-normal);border-color:var(--dc-green);}
/* ── Pending Accounts (Owner Panel) ── */
.nc-op-pending-badge{display:inline-flex;align-items:center;justify-content:center;background:var(--dc-red);color:#fff;font-size:10px;font-weight:700;border-radius:8px;padding:1px 6px;margin-left:6px;font-family:'Inter',sans-serif;}
.nc-op-pending-row{display:flex;align-items:center;gap:8px;background:rgba(35,165,90,.06);border:1px solid rgba(35,165,90,.25);border-radius:7px;padding:8px 12px;margin-bottom:6px;}
.nc-op-pending-info{flex:1;display:flex;flex-direction:column;gap:2px;}
.nc-op-pending-name{font-size:13px;font-weight:600;color:var(--dc-text-normal);}
.nc-op-pending-meta{font-size:10px;color:var(--dc-text-muted);}
.nc-op-approve-btn{background:rgba(35,165,90,.18);border:1px solid rgba(35,165,90,.4);border-radius:4px;color:var(--dc-green);font-size:12px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-op-approve-btn:hover{background:rgba(35,165,90,.3);filter:none!important;}
.nc-op-deny-btn{background:transparent;border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-red);font-size:12px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-op-deny-btn:hover{background:rgba(242,63,67,.12);border-color:var(--dc-red);filter:none!important;}
.nc-op-pending-role-select{background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-text-normal);padding:3px 6px;font-size:11px;font-family:'Inter',sans-serif;outline:none;cursor:pointer;}
#ncOwnerNotifBadge{position:absolute;top:-4px;right:-4px;background:var(--dc-red);color:#fff;font-size:10px;font-weight:700;border-radius:50%;width:16px;height:16px;display:none;align-items:center;justify-content:center;font-family:'Inter',sans-serif;}
#ncOwnerNotifBadge.visible{display:flex;}
.nc-owner-btn-wrap{position:relative;display:inline-flex;}
/* ── Free Plan Upgrade Popup ── */
#ncUpgradeOverlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.65);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:'Inter','Segoe UI',sans-serif;backdrop-filter:blur(3px);}
#ncUpgradeBox{background:var(--dc-bg-primary);border:1px solid var(--dc-border-subtle);border-radius:16px;padding:32px 30px 26px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,.8),0 0 0 1px rgba(88,101,242,.15);box-sizing:border-box;text-align:center;position:relative;animation:ncUpgradePop .25s cubic-bezier(.34,1.56,.64,1);}
@keyframes ncUpgradePop{from{transform:scale(.85);opacity:0;}to{transform:scale(1);opacity:1;}}
.nc-upgrade-emoji{font-size:48px;margin-bottom:10px;display:block;animation:ncUpgradeBounce 1.2s ease-in-out infinite;}
@keyframes ncUpgradeBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
.nc-upgrade-title{font-size:20px;font-weight:800;color:var(--dc-text-normal);margin-bottom:8px;letter-spacing:.02em;}
.nc-upgrade-msg{font-size:13px;color:var(--dc-text-muted);line-height:1.7;margin-bottom:20px;}
.nc-upgrade-msg strong{color:var(--dc-blurple-light);}
#ncUpgradeBtn{width:100%;background:linear-gradient(135deg,var(--dc-blurple),var(--dc-blurple-light));color:#fff;border:none;border-radius:8px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:.03em;transition:filter .15s;box-shadow:0 4px 16px rgba(88,101,242,.4);}
#ncUpgradeBtn:hover{filter:brightness(1.1);}
#ncUpgradeDismiss{margin-top:12px;background:transparent;border:none;color:var(--dc-text-muted);font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;padding:4px 8px;border-radius:4px;transition:color .12s;display:none;}
#ncUpgradeDismiss.visible{display:inline-block;}
#ncUpgradeDismiss:hover{color:var(--dc-text-normal);}
.nc-upgrade-badge{display:inline-block;background:rgba(240,177,50,.18);color:var(--dc-yellow);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:10px;border:1px solid rgba(240,177,50,.3);margin-bottom:14px;}
`;
document.head.appendChild(ncLoginStyle);

// ── Build login overlay ──
function ncShowLogin(){
  if(document.getElementById("ncLoginOverlay"))return;
  const overlay=document.createElement("div");overlay.id="ncLoginOverlay";

  // ── Login screen HTML ──
  function showLoginScreen(){
    overlay.innerHTML=`
    <div id="ncLoginBox">
      <h2>⚙ Noob Controller</h2>
      <div class="nc-login-sub">Sign in to access the controller</div>
      <div class="nc-login-field">
        <label>Username</label>
        <input id="ncLoginUser" type="text" placeholder="Enter username" autocomplete="off">
      </div>
      <div class="nc-login-field">
        <label>Password</label>
        <input id="ncLoginPass" type="password" placeholder="Enter password" autocomplete="off">
      </div>
      <button id="ncLoginBtn">Sign In</button>
      <div id="ncLoginErr"></div>
      <button id="ncRegCreateBtn">✨ Create an Account</button>
      <button id="ncGuestBtn" style="width:100%;background:transparent;color:var(--dc-text-muted);border:1px solid var(--dc-border-subtle);border-radius:5px;padding:9px;font-size:13px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;margin-top:8px;transition:all .15s;">Continue as Guest</button>
      <div id="ncLoginFooter">Noob Controller v0.25 · Private Build</div>
    </div>`;
    const userInput=overlay.querySelector("#ncLoginUser");
    const passInput=overlay.querySelector("#ncLoginPass");
    const errDiv=overlay.querySelector("#ncLoginErr");
    overlay.querySelector("#ncLoginBtn").addEventListener("click",attemptLogin);
    passInput.addEventListener("keydown",e=>{if(e.key==="Enter")attemptLogin();});
    userInput.addEventListener("keydown",e=>{if(e.key==="Enter")passInput.focus();});
    overlay.querySelector("#ncRegCreateBtn").addEventListener("click",showRegisterScreen);
    overlay.querySelector("#ncGuestBtn").addEventListener("click",()=>{
      const guestAcc={username:"Guest",password:"",role:"free"};
      overlay.remove();ncShowMenu(guestAcc);
    });
    async function attemptLogin(){
      const u=userInput.value.trim();const p=passInput.value;
      const acc=await ncFindAccount(u,p);
      if(acc){
        // Check if account is pending approval
        const pending=ncLoadPending();
        if(pending.some(p=>p.username===u)){
          errDiv.textContent="⏳ Your account is pending owner approval.";
          return;
        }
        ncSaveSession(acc.username);overlay.remove();ncShowMenu(acc);
      } else {
        errDiv.textContent="❌ Invalid username or password.";
        passInput.value="";passInput.focus();
      }
    }
    setTimeout(()=>userInput.focus(),50);
  }

  // ── Register screen HTML ──
  function showRegisterScreen(){
    overlay.innerHTML=`
    <div id="ncRegisterBox">
      <h2>✨ Create Account</h2>
      <div class="nc-reg-sub">Fill in the details below. Your account will be reviewed by the owner before activation.</div>
      <div class="nc-reg-field">
        <label>Username <span style="color:var(--dc-red)">*</span></label>
        <input id="ncRegUser" type="text" placeholder="Choose a username" autocomplete="off" maxlength="32">
      </div>
      <div class="nc-reg-field">
        <label>Display Name <span style="font-weight:400;font-size:10px;color:var(--dc-text-muted)">(optional)</span></label>
        <input id="ncRegDisplay" type="text" placeholder="How you appear in chat" autocomplete="off" maxlength="32">
      </div>
      <div class="nc-reg-field">
        <label>Password <span style="color:var(--dc-red)">*</span></label>
        <input id="ncRegPass" type="password" placeholder="Choose a password" autocomplete="off">
      </div>
      <div class="nc-reg-field">
        <label>Confirm Password <span style="color:var(--dc-red)">*</span></label>
        <input id="ncRegPassConfirm" type="password" placeholder="Repeat your password" autocomplete="off">
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dc-text-muted);margin-bottom:7px;">Terms of Conditions</div>
      <div id="ncRegTosBox">
        <strong>By creating an account you agree to all of the following:</strong><br><br>
        1. <strong>🔒 No Leaking</strong> — You must NEVER share, distribute, publish, or leak this script or any part of its source code to anyone outside this group. This includes Discord, GitHub, Reddit, or any other platform.<br><br>
        2. <strong>⚠️ No Redistribution</strong> — You may not resell, re-upload, or redistribute this script under any circumstances.<br><br>
        3. <strong>🤝 Respectful Use</strong> — Use this tool responsibly. Do not use it to harass, grief, or ruin the experience of other players beyond normal gameplay.<br><br>
        4. <strong>🛡 Account Security</strong> — Keep your password private. You are responsible for any actions taken on your account.<br><br>
        5. <strong>👑 Owner Authority</strong> — The owner reserves the right to remove or change your account role at any time for any reason.<br><br>
        Violation of these terms will result in immediate account removal.
      </div>
      <div class="nc-reg-tos-row">
        <input type="checkbox" id="ncRegTosCheck">
        <label for="ncRegTosCheck">I have read and agree to the <span>Terms of Conditions</span>. I will <strong>never</strong> leak or share this script.</label>
      </div>
      <button id="ncRegSubmitBtn" disabled>📨 Submit Request</button>
      <div id="ncRegErr"></div>
      <button id="ncRegBackBtn">← Back to Sign In</button>
    </div>`;

    const tosCheck=overlay.querySelector("#ncRegTosCheck");
    const submitBtn=overlay.querySelector("#ncRegSubmitBtn");
    const errDiv=overlay.querySelector("#ncRegErr");

    tosCheck.addEventListener("change",()=>{submitBtn.disabled=!tosCheck.checked;});
    overlay.querySelector("#ncRegBackBtn").addEventListener("click",showLoginScreen);

    submitBtn.addEventListener("click",async()=>{
      const username=overlay.querySelector("#ncRegUser").value.trim();
      const displayName=overlay.querySelector("#ncRegDisplay").value.trim();
      const pass=overlay.querySelector("#ncRegPass").value;
      const passConfirm=overlay.querySelector("#ncRegPassConfirm").value;
      errDiv.textContent="";
      // Validate
      if(!username||!pass){errDiv.textContent="❌ Username and password are required.";return;}
      if(username.length<3){errDiv.textContent="❌ Username must be at least 3 characters.";return;}
      if(pass.length<4){errDiv.textContent="❌ Password must be at least 4 characters.";return;}
      if(pass!==passConfirm){errDiv.textContent="❌ Passwords do not match.";return;}
      if(!tosCheck.checked){errDiv.textContent="❌ You must agree to the Terms of Conditions.";return;}
      if(ncFindByUsername(username)){errDiv.textContent="❌ That username is already taken.";return;}
      const pending=ncLoadPending();
      if(pending.some(p=>p.username===username)){errDiv.textContent="❌ A request with that username is already pending.";return;}
      // Hash & submit
      submitBtn.disabled=true;submitBtn.textContent="⏳ Submitting…";
      const hashed=await ncHashPassword(pass);
      const request={
        username,
        displayName:displayName||"",
        password:hashed,
        requestedAt:new Date().toLocaleString(),
        ts:Date.now()
      };
      pending.push(request);
      ncSavePending(pending);
      // Show success screen
      overlay.innerHTML=`
      <div id="ncRegisterBox" style="text-align:center;">
        <div style="font-size:44px;margin-bottom:12px;">✅</div>
        <h2 style="margin-bottom:8px;">Request Sent!</h2>
        <div class="nc-reg-sub" style="font-size:13px;line-height:1.7;">Your account request has been submitted.<br>The owner will review it shortly.<br>Once approved, you can sign in normally.</div>
        <button id="ncRegDoneBtn" style="margin-top:20px;width:100%;background:var(--dc-blurple);color:#fff;border:none;border-radius:5px;padding:11px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">← Back to Sign In</button>
      </div>`;
      overlay.querySelector("#ncRegDoneBtn").addEventListener("click",showLoginScreen);
    });
    overlay.querySelector("#ncRegUser").focus();
  }

  document.body.appendChild(overlay);
  showLoginScreen();
}

// ── Apply role-based restrictions ──
function ncApplyRoleRestrictions(acc){
  if(acc.role==="owner"||acc.role==="beta")return; // full access

  if(acc.role==="demo"){
    // Demo: same visible layout as free user first — remove same locked items
    NC_FREE_LOCKED_BTNS.forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
    NC_FREE_LOCKED_PANELS.forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
    // Then freeze ALL remaining interactive elements
    setTimeout(()=>ncApplyDemoFreeze(),50);
    return;
  }

  // Free user: remove locked buttons/panels from DOM entirely
  NC_FREE_LOCKED_BTNS.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.remove();
  });
  NC_FREE_LOCKED_PANELS.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.remove();
  });
}

// ── Demo freeze + guided tour: disable interactivity, show contextual tips ──

// Tips mapped to element IDs — what each part of the free UI does
const NC_DEMO_TIPS=[
  {id:"ncGuideBtn",     title:"📡 Codespace Guide",  text:"Step-by-step guide to connect a GitHub Codespace as your bot server. Shows how to set up ports, get your WSS URL, and start spawning bots."},
  {id:"ncMediaBtn",     title:"🎵 Music Player",      text:"Built-in media player. Paste a video/audio URL to play music while you play. Supports YouTube links and direct audio files."},
  {id:"ncCompactBtn",   title:"⬛ Compact Mode",      text:"Switches to a smaller quick-control view — useful when you just need to reconnect or spawn bots fast without the full menu."},
  {id:"ncStatus",       title:"🔌 Connection Status", text:"Shows whether your bot server is connected (green) or disconnected (red). Updates live as bots connect and disconnect."},
  {id:"reconnectAll",   title:"↺ Reconnect All",      text:"Reconnects all saved bot servers at once. Useful after a Codespace restart or network drop."},
  {id:"serverHash",     title:"# Server Hash",        text:"The game room ID from the arras.io URL — the part after the # symbol (e.g. arras.io/#ca → type 'ca' here). Bots join this room."},
  {id:"tankSelect",     title:"🛡 Tank Selector",     text:"Choose which tank type your bots will spawn as. Different tanks have different stats and behaviours."},
  {id:"connectNoob",    title:"▶ Connect 1",          text:"Spawns a single bot into the game room with the selected tank. Good for testing before spawning many at once."},
  {id:"botCount",       title:"🔢 Bot Count",         text:"How many bots to spawn when you hit Spawn Multi. Set this to any number — higher counts need a powerful server."},
  {id:"spawnMulti",     title:"⚡ Spawn Multi",       text:"Spawns multiple bots at once based on the count above. All bots join the same game room with the selected tank."},
  {id:"deleteNoobs",    title:"💀 Kill All",           text:"Disconnects and removes all currently active bots from the game instantly."},
  {id:"autoRotateBtn",  title:"🔄 Auto Rotate",       text:"Bots automatically rotate their movement direction over time, making them look more natural and harder to avoid."},
  {id:"stayPutBtn",     title:"📍 Stay Put",          text:"Bots stop moving and hold their current position. Useful for farming or testing."},
  {id:"growthModeBtn",  title:"📈 Growth Mode",       text:"Bots focus on surviving and growing their score rather than targeting players."},
  {id:"addLocal",       title:"➕ Add Local Server",  text:"Adds a local WebSocket server (e.g. ws://localhost:8082) to the server list for testing on your own machine."},
  {id:"addSpace",       title:"➕ Add Codespace",     text:"Adds a GitHub Codespace server. Paste your wss:// URL here to connect remote bot servers."},
];

function ncApplyDemoFreeze(){
  const menuEl=document.getElementById("scriptMenu");
  if(!menuEl)return;

  // Block all interaction except logout
  menuEl.addEventListener("click",ncDemoBlockEvent,true);
  menuEl.addEventListener("mousedown",ncDemoBlockEvent,true);
  menuEl.addEventListener("keydown",ncDemoBlockEvent,true);
  menuEl.addEventListener("input",ncDemoBlockEvent,true);
  menuEl.addEventListener("change",ncDemoBlockEvent,true);

  // Dim interactive elements
  const demoStyle=document.createElement("style");
  demoStyle.id="ncDemoStyle";
  demoStyle.textContent=`
    #scriptMenu button:not(#ncLogoutBtn):not(#ncChatBtn){opacity:.55!important;cursor:not-allowed!important;}
    #scriptMenu input,#scriptMenu select,#scriptMenu textarea{opacity:.55!important;pointer-events:none!important;}
    .nc-demo-hotspot{position:absolute;width:20px;height:20px;border-radius:50%;background:#e07b8a;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer!important;pointer-events:all!important;z-index:8000;box-shadow:0 0 0 3px rgba(224,123,138,.3);animation:ncDemoPulse 1.6s infinite;font-family:'Inter',sans-serif;border:none;}
    .nc-demo-hotspot:hover{background:#f0a0b0;box-shadow:0 0 0 5px rgba(224,123,138,.4);}
    @keyframes ncDemoPulse{0%,100%{box-shadow:0 0 0 3px rgba(224,123,138,.3);}50%{box-shadow:0 0 0 7px rgba(224,123,138,.1);}}
    #ncDemoCard{position:fixed;background:#1e1f22;border:1px solid #e07b8a;border-radius:10px;padding:14px 16px;max-width:280px;font-family:'Inter',sans-serif;z-index:99999;box-shadow:0 8px 28px rgba(0,0,0,.7);display:none;}
    #ncDemoCard.visible{display:block;}
    #ncDemoCard .nc-dc-title{font-size:13px;font-weight:700;color:#f2dde0;margin-bottom:6px;}
    #ncDemoCard .nc-dc-text{font-size:12px;color:#b5a0a5;line-height:1.6;}
    #ncDemoCard .nc-dc-close{position:absolute;top:8px;right:10px;background:transparent;border:none;color:#7a4a4a;font-size:14px;cursor:pointer!important;pointer-events:all!important;line-height:1;}
    #ncDemoCard .nc-dc-close:hover{color:#f2dde0;}
    #ncDemoBanner{position:fixed;top:0;left:0;width:100%;background:linear-gradient(90deg,#1a0a0a,#2d1a1e);border-bottom:2px solid #e07b8a;color:#f2dde0;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;padding:7px 16px;z-index:9998;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;letter-spacing:.03em;}
    #ncDemoBanner span{display:flex;align-items:center;gap:7px;}
    #ncDemoTipCount{font-size:11px;color:#e07b8a;background:rgba(224,123,138,.15);padding:2px 8px;border-radius:10px;}
  `;
  document.head.appendChild(demoStyle);

  // Top demo banner
  const banner=document.createElement("div");banner.id="ncDemoBanner";
  banner.innerHTML=`<span>🎮 Demo Mode — <span style="color:#e07b8a;">hover the pink ● dots</span> to learn what each feature does</span><span id="ncDemoTipCount">0 / ${NC_DEMO_TIPS.length} tips</span>`;
  document.body.appendChild(banner);

  // Floating tip card
  const card=document.createElement("div");card.id="ncDemoCard";
  card.innerHTML=`<button class="nc-dc-close" id="ncDemoCardClose">✕</button><div class="nc-dc-title" id="ncDcTitle"></div><div class="nc-dc-text" id="ncDcText"></div>`;
  document.body.appendChild(card);
  document.getElementById("ncDemoCardClose").addEventListener("click",e=>{
    e.stopPropagation();card.classList.remove("visible");
  },{capture:true});

  let seenTips=new Set();
  function updateCount(){document.getElementById("ncDemoTipCount").textContent=`${seenTips.size} / ${NC_DEMO_TIPS.length} tips`;}

  // Place hotspot dots next to each element
  setTimeout(()=>{
    NC_DEMO_TIPS.forEach(tip=>{
      const el=document.getElementById(tip.id);
      if(!el)return;
      const rect=el.getBoundingClientRect();
      const dot=document.createElement("button");dot.className="nc-demo-hotspot";dot.textContent="?";
      dot.style.cssText=`left:${rect.right+window.scrollX-10}px;top:${rect.top+window.scrollY+rect.height/2-10}px;`;
      document.body.appendChild(dot);

      dot.addEventListener("click",e=>{
        e.stopPropagation();e.preventDefault();
        document.getElementById("ncDcTitle").textContent=tip.title;
        document.getElementById("ncDcText").textContent=tip.text;
        // Position card near the dot but keep on screen
        const dr=dot.getBoundingClientRect();
        let cx=dr.right+12,cy=dr.top;
        if(cx+290>window.innerWidth)cx=dr.left-300;
        if(cy+120>window.innerHeight)cy=window.innerHeight-130;
        card.style.left=cx+"px";card.style.top=cy+"px";
        card.classList.add("visible");
        seenTips.add(tip.id);updateCount();
      },{capture:true});
    });
  },100);
}

function ncDemoBlockEvent(e){
  if(e.target.id==="ncLogoutBtn"||e.target.classList.contains("nc-demo-hotspot")||e.target.id==="ncDemoCardClose"||e.target.id==="ncChatBtn"||e.target.closest("#ncChatPanel"))return;
  e.stopPropagation();
  e.preventDefault();
}

// ── Preview-as-account system ──
const ncPreviewStyle=document.createElement("style");
ncPreviewStyle.textContent=`
.nc-op-preview-btn{background:transparent;border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-blurple-light);font-size:12px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-op-preview-btn:hover{background:rgba(88,101,242,.14);border-color:var(--dc-blurple);filter:none!important;}
#ncPreviewBanner{position:fixed;bottom:0;left:0;width:100%;background:#1a0d2e;border-top:2px solid #7b2fff;color:#e8e6ff;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;padding:10px 18px;z-index:9999;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;}
#ncPreviewBanner span{display:flex;align-items:center;gap:8px;}
#ncPreviewBanner em{font-style:normal;color:#a76dff;}
#ncExitPreviewBtn{background:#7b2fff;color:#fff;border:none;border-radius:5px;padding:6px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:background .12s;}
#ncExitPreviewBtn:hover{background:#5a1fd4;}
`;
document.head.appendChild(ncPreviewStyle);

function ncPreviewAsAccount(previewAcc){
  // Store real owner account
  const realAcc=window._ncCurrentAcc;

  // Remove existing badge + panels so we can re-inject as preview user
  document.getElementById("ncUserBadge")?.remove();
  document.getElementById("ncOwnerPanel")?.remove();
  document.getElementById("ncSuggestPanel")?.remove();
  document.getElementById("ncDemoStyle")?.remove();

  // Remove any existing demo freeze listeners by cloning the menu
  const oldMenu=document.getElementById("scriptMenu");
  const newMenu=oldMenu.cloneNode(true);
  oldMenu.parentNode.replaceChild(newMenu,oldMenu);

  // Re-run restrictions for preview role
  window._ncCurrentAcc=previewAcc;
  ncInjectUserBadge(previewAcc);
  ncApplyRoleRestrictions(previewAcc);

  // Hide logout button during preview so they can't accidentally log out
  const logoutBtn=document.getElementById("ncLogoutBtn");
  if(logoutBtn)logoutBtn.style.display="none";

  // Show preview banner
  const existing=document.getElementById("ncPreviewBanner");
  if(existing)existing.remove();
  const banner=document.createElement("div");banner.id="ncPreviewBanner";
  const roleColor=NC_ROLE_COLORS[previewAcc.role]||"#949ba4";
  banner.innerHTML=`<span>👁 Previewing as <em>${previewAcc.displayName||previewAcc.username}</em> <span style="font-size:11px;padding:2px 8px;border-radius:5px;background:${roleColor}22;color:${roleColor};">${NC_ROLE_BADGES[previewAcc.role]||previewAcc.role}</span></span><button id="ncExitPreviewBtn">✕ Exit Preview</button>`;
  document.body.appendChild(banner);

  document.getElementById("ncExitPreviewBtn").addEventListener("click",()=>{
    banner.remove();
    // Remove preview badge/panels
    document.getElementById("ncUserBadge")?.remove();
    document.getElementById("ncOwnerPanel")?.remove();
    document.getElementById("ncSuggestPanel")?.remove();
    document.getElementById("ncDemoStyle")?.remove();

    // Clone menu again to strip any demo freeze listeners
    const pm=document.getElementById("scriptMenu");
    const rm=pm.cloneNode(true);
    pm.parentNode.replaceChild(rm,pm);

    // Re-restore owner view
    window._ncCurrentAcc=realAcc;
    ncInjectUserBadge(realAcc);
    // Owner gets no restrictions
  });
}

// ── Owner Panel: account manager ──
function ncBuildOwnerPanel(){
  if(document.getElementById("ncOwnerPanel"))return;
  const panel=document.createElement("div");panel.id="ncOwnerPanel";
  document.body.appendChild(panel);
  ncRefreshOwnerPanel();
}

function ncUpdateOwnerNotifBadge(){
  const badge=document.getElementById("ncOwnerNotifBadge");
  if(!badge)return;
  const count=ncPendingCount();
  if(count>0){badge.textContent=count>9?"9+":count;badge.classList.add("visible");}
  else{badge.textContent="";badge.classList.remove("visible");}
}

function ncRefreshOwnerPanel(){
  const panel=document.getElementById("ncOwnerPanel");if(!panel)return;
  const suggestions=JSON.parse(localStorage.getItem(NC_SUGGESTIONS_KEY)||"[]");
  const pending=ncLoadPending();
  panel.innerHTML=`
  <div class="nc-op-title">
    👑 Owner Panel — Account Manager
    <button class="nc-op-close" id="ncOpClose">✕</button>
  </div>

  <div class="nc-op-section">⏳ Pending Requests <span class="nc-op-pending-badge" id="ncPendingBadge" style="${pending.length===0?'display:none':''}">${pending.length}</span></div>
  <div id="ncOpPendingList">${pending.length===0?'<div class="nc-suggest-inbox-empty" style="padding:10px 0;">No pending requests.</div>':''}</div>

  <div class="nc-op-section">Accounts</div>
  <div id="ncOpAccountList"></div>

  <div class="nc-op-section">Add Account</div>
  <div class="nc-op-add-form">
    <input id="ncOpNewUser" placeholder="Username (for login)" autocomplete="off">
    <input id="ncOpNewDisplay" placeholder="Display Name (optional)" autocomplete="off">
    <input id="ncOpNewPass" type="password" placeholder="Password" autocomplete="off">
    <select id="ncOpNewRole">
      <option value="free">🆓 Free User</option>
      <option value="demo">🎮 Demo Noob</option>
      <option value="beta">🧪 Beta Tester</option>
      <option value="owner">👑 Owner</option>
    </select>
    <button class="nc-op-add-btn" id="ncOpAddBtn" style="grid-column:span 1;">➕ Add Account</button>
    <div class="nc-op-msg" id="ncOpMsg"></div>
  </div>

  <div class="nc-op-section">Reset Password</div>
  <div class="nc-op-add-form" id="ncOpResetForm" style="display:none;">
    <div style="grid-column:span 2;font-size:13px;color:var(--dc-text-muted);font-family:'Inter',sans-serif;">Resetting password for: <strong id="ncOpResetTarget" style="color:var(--dc-text-normal);"></strong></div>
    <input id="ncOpResetPass" type="password" placeholder="New password" autocomplete="off" style="grid-column:span 2;">
    <button class="nc-op-add-btn" id="ncOpResetConfirmBtn" style="grid-column:span 1;">✅ Confirm Reset</button>
    <button class="nc-op-add-btn" id="ncOpResetCancelBtn" style="grid-column:span 1;background:var(--dc-bg-secondary);border:1px solid var(--dc-border-subtle);color:var(--dc-text-muted);">✕ Cancel</button>
    <div class="nc-op-msg" id="ncOpResetMsg" style="grid-column:span 2;"></div>
  </div>

  <div class="nc-op-section">💡 Suggestions Inbox (${suggestions.length})</div>
  <div id="ncOpSuggestInbox">${suggestions.length===0
    ? '<div class="nc-suggest-inbox-empty">No suggestions yet.</div>'
    : suggestions.map((s,i)=>`<div class="nc-suggest-inbox-item"><div class="nc-suggest-inbox-from">From: ${s.from} · ${s.time}</div><div class="nc-suggest-inbox-text">${s.text}</div></div>`).join("")
  }</div>
  `;

  // Render pending request rows
  const pendingList=document.getElementById("ncOpPendingList");
  if(pendingList&&pending.length>0){
    pending.forEach((req,i)=>{
      const row=document.createElement("div");row.className="nc-op-pending-row";
      row.innerHTML=`
        <div class="nc-op-pending-info">
          <div class="nc-op-pending-name">${req.displayName?req.displayName+' <span style="font-size:11px;font-weight:400;color:var(--dc-text-muted);">('+req.username+')</span>':req.username}</div>
          <div class="nc-op-pending-meta">Requested: ${req.requestedAt||"Unknown"}</div>
        </div>
        <select class="nc-op-pending-role-select" data-pidx="${i}">
          <option value="free">🆓 Free</option>
          <option value="demo">🎮 Demo</option>
          <option value="beta">🧪 Beta</option>
          <option value="owner">👑 Owner</option>
        </select>
        <button class="nc-op-approve-btn" data-pidx="${i}">✅ Approve</button>
        <button class="nc-op-deny-btn" data-pidx="${i}">🗑 Deny</button>
      `;
      pendingList.appendChild(row);
    });
    // Approve
    pendingList.querySelectorAll(".nc-op-approve-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const idx=parseInt(btn.dataset.pidx);
        const reqs=ncLoadPending();
        const req=reqs[idx];if(!req)return;
        const roleEl=pendingList.querySelector(`.nc-op-pending-role-select[data-pidx="${idx}"]`);
        const role=roleEl?roleEl.value:"free";
        // Move from pending to full accounts
        const newAcc={username:req.username,password:req.password,role};
        if(req.displayName)newAcc.displayName=req.displayName;
        NC_ACCOUNTS.push(newAcc);
        ncSaveAccounts(NC_ACCOUNTS);
        reqs.splice(idx,1);ncSavePending(reqs);
        ncUpdateOwnerNotifBadge();
        ncRefreshOwnerPanel();
        showToast(`✅ Approved: ${req.displayName||req.username}`);
      });
    });
    // Deny
    pendingList.querySelectorAll(".nc-op-deny-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const idx=parseInt(btn.dataset.pidx);
        const reqs=ncLoadPending();
        const req=reqs[idx];if(!req)return;
        reqs.splice(idx,1);ncSavePending(reqs);
        ncUpdateOwnerNotifBadge();
        ncRefreshOwnerPanel();
        showToast(`🗑 Denied: ${req.displayName||req.username}`,true);
      });
    });
  }

  // Render account rows
  const list=document.getElementById("ncOpAccountList");
  NC_ACCOUNTS.forEach((acc,i)=>{
    const color=NC_ROLE_COLORS[acc.role]||"#949ba4";
    const row=document.createElement("div");row.className="nc-op-account-row";
    row.innerHTML=`
      <span class="nc-op-acc-name">${acc.displayName||acc.username} <span style="font-size:11px;color:var(--dc-text-muted);font-weight:400;">(${acc.username})</span></span>
      <span class="nc-op-acc-role" style="background:${color}22;color:${color};">${NC_ROLE_BADGES[acc.role]||acc.role}</span>
      <select class="nc-op-role-select" data-idx="${i}">
        <option value="free"${acc.role==="free"?" selected":""}>Free</option>
        <option value="demo"${acc.role==="demo"?" selected":""}>Demo</option>
        <option value="beta"${acc.role==="beta"?" selected":""}>Beta</option>
        <option value="owner"${acc.role==="owner"?" selected":""}>Owner</option>
      </select>
      <button class="nc-op-preview-btn" data-idx="${i}" title="See the menu as this user">👁 View</button>
      <button class="nc-op-reset-btn" data-idx="${i}" title="Reset password">🔑 Reset</button>
      <button class="nc-op-del-btn" data-idx="${i}">🗑 Del</button>
    `;
    list.appendChild(row);
  });

  // Preview as account
  list.querySelectorAll(".nc-op-preview-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=parseInt(btn.dataset.idx);
      const previewAcc=NC_ACCOUNTS[idx];
      document.getElementById("ncOwnerPanel").classList.remove("open");
      ncPreviewAsAccount(previewAcc);
    });
  });
  // Role change
  list.querySelectorAll(".nc-op-role-select").forEach(sel=>{
    sel.addEventListener("change",()=>{
      const idx=parseInt(sel.dataset.idx);
      NC_ACCOUNTS[idx].role=sel.value;
      ncSaveAccounts(NC_ACCOUNTS);
      ncRefreshOwnerPanel();
    });
  });
  // Delete
  list.querySelectorAll(".nc-op-del-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=parseInt(btn.dataset.idx);
      if(NC_ACCOUNTS.length<=1){document.getElementById("ncOpMsg").textContent="❌ Can't delete the last account.";document.getElementById("ncOpMsg").className="nc-op-msg err";return;}
      NC_ACCOUNTS.splice(idx,1);ncSaveAccounts(NC_ACCOUNTS);ncRefreshOwnerPanel();
    });
  });
  // Reset password
  let resetIdx=-1;
  list.querySelectorAll(".nc-op-reset-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      resetIdx=parseInt(btn.dataset.idx);
      const acc=NC_ACCOUNTS[resetIdx];
      document.getElementById("ncOpResetTarget").textContent=acc.displayName||acc.username;
      document.getElementById("ncOpResetForm").style.display="";
      document.getElementById("ncOpResetPass").value="";
      document.getElementById("ncOpResetMsg").textContent="";
      document.getElementById("ncOpResetPass").focus();
    });
  });
  document.getElementById("ncOpResetConfirmBtn").addEventListener("click",()=>{
    const p=document.getElementById("ncOpResetPass").value;
    const msg=document.getElementById("ncOpResetMsg");
    if(!p){msg.textContent="❌ Password cannot be empty.";msg.className="nc-op-msg err";return;}
    ncHashPassword(p).then(hashed=>{
      NC_ACCOUNTS[resetIdx].password=hashed;
      ncSaveAccounts(NC_ACCOUNTS);
      msg.textContent="✅ Password reset!";msg.className="nc-op-msg ok";
      setTimeout(()=>{document.getElementById("ncOpResetForm").style.display="none";ncRefreshOwnerPanel();},1200);
    });
  });
  document.getElementById("ncOpResetCancelBtn").addEventListener("click",()=>{
    document.getElementById("ncOpResetForm").style.display="none";
    resetIdx=-1;
  });
  // Add account
  document.getElementById("ncOpAddBtn").addEventListener("click",()=>{
    const u=document.getElementById("ncOpNewUser").value.trim();
    const d=document.getElementById("ncOpNewDisplay").value.trim();
    const p=document.getElementById("ncOpNewPass").value;
    const r=document.getElementById("ncOpNewRole").value;
    const msg=document.getElementById("ncOpMsg");
    if(!u||!p){msg.textContent="❌ Username and password required.";msg.className="nc-op-msg err";return;}
    if(ncFindByUsername(u)){msg.textContent="❌ Username already exists.";msg.className="nc-op-msg err";return;}
    ncHashPassword(p).then(hashed=>{
      const newAcc={username:u,password:hashed,role:r};
      if(d)newAcc.displayName=d;
      NC_ACCOUNTS.push(newAcc);
      ncSaveAccounts(NC_ACCOUNTS);
      msg.textContent="✅ Account added!";msg.className="nc-op-msg ok";
      ncRefreshOwnerPanel();
    });
  });
  // Close
  document.getElementById("ncOpClose").addEventListener("click",()=>{panel.classList.remove("open");});
}

// ── Suggestion Panel (Beta users) ──
function ncBuildSuggestPanel(acc){
  if(document.getElementById("ncSuggestPanel"))return;
  const panel=document.createElement("div");panel.id="ncSuggestPanel";
  panel.innerHTML=`
  <div class="nc-suggest-title">
    💡 Submit a Suggestion
    <button class="nc-op-close" id="ncSuggestClose">✕</button>
  </div>
  <textarea id="ncSuggestInput" placeholder="Describe your idea or feedback for the script..."></textarea>
  <button id="ncSuggestSend">📨 Send to Owner</button>
  <div id="ncSuggestMsg"></div>
  `;
  document.body.appendChild(panel);
  document.getElementById("ncSuggestClose").addEventListener("click",()=>panel.classList.remove("open"));
  document.getElementById("ncSuggestSend").addEventListener("click",()=>{
    const text=document.getElementById("ncSuggestInput").value.trim();
    const msg=document.getElementById("ncSuggestMsg");
    if(!text){msg.textContent="❌ Please write something first.";msg.style.color="var(--dc-red)";return;}
    const suggestions=JSON.parse(localStorage.getItem(NC_SUGGESTIONS_KEY)||"[]");
    suggestions.push({from:acc.username,text,time:new Date().toLocaleString()});
    localStorage.setItem(NC_SUGGESTIONS_KEY,JSON.stringify(suggestions));
    document.getElementById("ncSuggestInput").value="";
    msg.textContent="✅ Suggestion sent to the Owner!";msg.style.color="var(--dc-green)";
    setTimeout(()=>{msg.textContent="";},3000);
  });
}


// ─── DEV MENU ────────────────────────────────────────────────────────────────
const ncDevStyle=document.createElement("style");
ncDevStyle.textContent=`
#ncDevMenu{position:fixed;top:50%;right:24px;transform:translateY(-50%);width:520px;max-height:88vh;overflow-y:auto;background:#0e0f1a;border:1.5px solid #00ff8833;border-radius:12px;padding:0;z-index:9998;display:none;box-shadow:0 8px 40px rgba(0,255,136,.10),0 2px 8px rgba(0,0,0,.7);font-family:'Inter',sans-serif;}
#ncDevMenu.open{display:block!important;}
#ncDevMenu::-webkit-scrollbar{width:4px;}
#ncDevMenu::-webkit-scrollbar-thumb{background:#00ff8833;border-radius:2px;}
.nc-dev-titlebar{display:flex;align-items:center;justify-content:space-between;padding:13px 16px 11px;border-bottom:1px solid #00ff8822;background:#0a0b14;border-radius:12px 12px 0 0;position:sticky;top:0;z-index:2;}
.nc-dev-titlebar span{font-size:15px;font-weight:700;color:#00ff88;letter-spacing:.04em;}
.nc-dev-close{background:transparent;border:none;color:#5a5880;font-size:18px;cursor:pointer;padding:0;line-height:1;transition:color .12s;}
.nc-dev-close:hover{color:#00ff88;}
.nc-dev-tabs{display:flex;gap:0;border-bottom:1px solid #1e1a3a;background:#0a0b14;position:sticky;top:47px;z-index:2;}
.nc-dev-tab{flex:1;background:transparent;border:none;border-bottom:2px solid transparent;color:#5a5880;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:9px 4px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;}
.nc-dev-tab.active{color:#00ff88;border-bottom-color:#00ff88;}
.nc-dev-tab:hover{color:#a0ffd0;}
.nc-dev-panel{display:none;padding:14px 16px;}
.nc-dev-panel.active{display:block;}
/* Notes */
#ncDevNotes{width:100%;min-height:280px;max-height:380px;resize:vertical;background:#05060e;border:1px solid #1e1a3a;border-radius:7px;color:#e8e6ff;font-family:'Courier New',monospace;font-size:13px;line-height:1.6;padding:11px;outline:none;box-sizing:border-box;}
#ncDevNotes:focus{border-color:#00ff8866;}
.nc-dev-notes-row{display:flex;gap:7px;margin-top:8px;align-items:center;}
.nc-dev-notes-status{font-size:12px;color:#5a5880;flex:1;}
.nc-dev-notes-status.ok{color:#00ff88;}
/* Browser */
.nc-dev-browser-bar{display:flex;gap:6px;margin-bottom:8px;align-items:center;}
#ncDevBrowserUrl{flex:1;background:#05060e;border:1px solid #1e1a3a;border-radius:5px;color:#e8e6ff;padding:7px 10px;font-family:'Inter',sans-serif;font-size:13px;outline:none;}
#ncDevBrowserUrl:focus{border-color:#00ff8866;}
.nc-dev-browser-btn{background:#00ff8822;border:1px solid #00ff8844;border-radius:5px;color:#00ff88;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;transition:all .12s;}
.nc-dev-browser-btn:hover{background:#00ff8833;}
#ncDevBrowserFrame{width:100%;height:340px;border:1px solid #1e1a3a;border-radius:7px;background:#000;}
.nc-dev-browser-presets{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;}
.nc-dev-browser-preset{font-size:11px;padding:3px 9px;border-radius:10px;border:1px solid #1e1a3a;background:#05060e;color:#5a5880;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;}
.nc-dev-browser-preset:hover{color:#00ff88;border-color:#00ff8855;}
/* Console */
#ncDevConsoleLog{background:#05060e;border:1px solid #1e1a3a;border-radius:7px;padding:10px;min-height:200px;max-height:280px;overflow-y:auto;font-family:'Courier New',monospace;font-size:12px;margin-bottom:8px;}
#ncDevConsoleLog::-webkit-scrollbar{width:3px;}
#ncDevConsoleLog::-webkit-scrollbar-thumb{background:#1e1a3a;border-radius:2px;}
.nc-dev-con-line{line-height:1.6;word-break:break-all;white-space:pre-wrap;}
.nc-dev-con-out{color:#e8e6ff;}
.nc-dev-con-err{color:#ff2d55;}
.nc-dev-con-info{color:#00ff88;}
.nc-dev-con-warn{color:#ffe600;}
.nc-dev-con-prompt{color:#7b2fff;}
.nc-dev-console-row{display:flex;gap:6px;align-items:center;}
#ncDevConsoleInput{flex:1;background:#05060e;border:1px solid #1e1a3a;border-radius:5px;color:#e8e6ff;padding:7px 10px;font-family:'Courier New',monospace;font-size:13px;outline:none;}
#ncDevConsoleInput:focus{border-color:#7b2fff88;}
/* LocalStorage */
#ncDevLsTable{width:100%;border-collapse:collapse;font-size:12px;font-family:'Courier New',monospace;}
#ncDevLsTable th{text-align:left;padding:6px 8px;color:#5a5880;font-size:11px;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid #1e1a3a;}
#ncDevLsTable td{padding:6px 8px;border-bottom:1px solid #0d0e1a;vertical-align:top;word-break:break-all;color:#e8e6ff;}
#ncDevLsTable td:first-child{color:#00ff88;width:35%;}
#ncDevLsTable tr:hover td{background:#0d0e1a;}
.nc-dev-ls-del{background:transparent;border:none;color:#ff2d55;cursor:pointer;font-size:12px;padding:0 4px;}
.nc-dev-ls-del:hover{color:#ff6b6b;}
.nc-dev-ls-actions{display:flex;gap:6px;margin-bottom:10px;}
/* Script AI */
.nc-dev-scriptal-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;}
.nc-dev-ai-chip{font-size:11px;padding:3px 9px;border-radius:10px;border:1px solid #1e1a3a;background:#05060e;color:#5a5880;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;white-space:nowrap;}
.nc-dev-ai-chip:hover{color:#00ff88;border-color:#00ff8855;}
#ncDevAiLog{min-height:180px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:8px;padding-right:2px;}
#ncDevAiLog::-webkit-scrollbar{width:3px;}
#ncDevAiLog::-webkit-scrollbar-thumb{background:#1e1a3a;border-radius:2px;}
.nc-dev-ai-msg{border-radius:6px;padding:8px 11px;font-size:13px;line-height:1.6;font-family:'Inter',sans-serif;word-break:break-word;}
.nc-dev-ai-msg.user{background:#0d0e1a;border:1px solid #1e1a3a;color:#e8e6ff;align-self:flex-end;max-width:88%;}
.nc-dev-ai-msg.bot{background:rgba(0,255,136,.07);border:1px solid rgba(0,255,136,.18);color:#e8e6ff;max-width:100%;}
.nc-dev-ai-msg.bot .nc-dev-ai-label{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#00ff88;margin-bottom:4px;display:block;}
.nc-dev-ai-msg code{font-family:'Courier New',monospace;font-size:11.5px;background:#05060e;padding:1px 5px;border-radius:3px;color:#00ff88;}
.nc-dev-ai-msg pre{background:#05060e;border:1px solid #1e1a3a;border-radius:5px;padding:8px 10px;font-family:'Courier New',monospace;font-size:11px;overflow-x:auto;margin:5px 0 0;color:#e8e6ff;white-space:pre-wrap;}
#ncDevAiThinking{font-size:12px;color:#5a5880;font-family:'Inter',sans-serif;padding:2px 0;margin-bottom:6px;}
.nc-dev-ai-input-row{display:flex;gap:6px;align-items:center;}
#ncDevAiInput{flex:1;background:#05060e;border:1px solid #1e1a3a;border-radius:5px;color:#e8e6ff;padding:7px 10px;font-family:'Inter',sans-serif;font-size:13px;outline:none;}
#ncDevAiInput:focus{border-color:#00ff8866;}
`;
document.head.appendChild(ncDevStyle);

const NC_DEV_NOTES_KEY="noobController_devNotes";

function ncBuildDevMenu(){
  if(document.getElementById("ncDevMenu"))return;
  const dm=document.createElement("div");dm.id="ncDevMenu";
  dm.innerHTML=`
  <div class="nc-dev-titlebar">
    <span>🛠 Developer Menu</span>
    <button class="nc-dev-close" id="ncDevClose">✕</button>
  </div>
  <div class="nc-dev-tabs">
    <button class="nc-dev-tab active" data-tab="notes">📝 Notes</button>
    <button class="nc-dev-tab" data-tab="browser">🌐 Browser</button>
    <button class="nc-dev-tab" data-tab="console">⌨️ Console</button>
    <button class="nc-dev-tab" data-tab="storage">💾 Storage</button>
    <button class="nc-dev-tab" data-tab="scriptal">🤖 Script AI</button>
  </div>

  <!-- NOTES -->
  <div class="nc-dev-panel active" data-panel="notes">
    <textarea id="ncDevNotes" placeholder="Personal notes — saved automatically..."></textarea>
    <div class="nc-dev-notes-row">
      <span class="nc-dev-notes-status" id="ncDevNotesSave"></span>
      <button class="nc-dev-browser-btn" id="ncDevNotesClear">🗑 Clear</button>
    </div>
  </div>

  <!-- BROWSER -->
  <div class="nc-dev-panel" data-panel="browser">
    <div class="nc-dev-browser-presets">
      <span class="nc-dev-browser-preset" data-url="https://arras.io">arras.io</span>
      <span class="nc-dev-browser-preset" data-url="https://github.com">GitHub</span>
      <span class="nc-dev-browser-preset" data-url="https://google.com">Google</span>
      <span class="nc-dev-browser-preset" data-url="https://discord.com/app">Discord</span>
      <span class="nc-dev-browser-preset" data-url="https://youtube.com">YouTube</span>
    </div>
    <div class="nc-dev-browser-bar">
      <input id="ncDevBrowserUrl" placeholder="Enter URL..." value="https://arras.io">
      <button class="nc-dev-browser-btn" id="ncDevBrowserGo">▶ Go</button>
      <button class="nc-dev-browser-btn" id="ncDevBrowserBack">◀</button>
      <button class="nc-dev-browser-btn" id="ncDevBrowserRefresh">↺</button>
    </div>
    <iframe id="ncDevBrowserFrame" src="https://arras.io" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
  </div>

  <!-- CONSOLE -->
  <div class="nc-dev-panel" data-panel="console">
    <div id="ncDevConsoleLog"><div class="nc-dev-con-line nc-dev-con-info">// NC Dev Console — ready</div></div>
    <div class="nc-dev-console-row">
      <input id="ncDevConsoleInput" placeholder="> Enter JS to evaluate...">
      <button class="nc-dev-browser-btn" id="ncDevConsoleRun">▶ Run</button>
      <button class="nc-dev-browser-btn" id="ncDevConsoleClear">Clear</button>
    </div>
  </div>

  <!-- STORAGE -->
  <div class="nc-dev-panel" data-panel="storage">
    <div class="nc-dev-ls-actions">
      <button class="nc-dev-browser-btn" id="ncDevLsRefresh">↺ Refresh</button>
      <button class="nc-dev-browser-btn" id="ncDevLsExport">⬇ Export All</button>
    </div>
    <div style="overflow-x:auto;border:1px solid #1e1a3a;border-radius:7px;">
      <table id="ncDevLsTable">
        <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
        <tbody id="ncDevLsBody"></tbody>
      </table>
    </div>
  </div>

  <!-- SCRIPT AI -->
  <div class="nc-dev-panel" data-panel="scriptal">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;">
      <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5a5880;">Script AI</span>
      <span style="font-size:10px;font-weight:700;background:rgba(0,255,136,.12);color:#00ff88;border:1px solid #00ff8833;border-radius:8px;padding:1px 8px;">&#x1F7E2; OFFLINE</span>
      <span style="font-size:10px;color:#5a5880;margin-left:auto;">No API key &middot; No internet</span>
    </div>
    <div class="nc-dev-scriptal-chips" id="ncDevAiChips">
      <span class="nc-dev-ai-chip" data-q="What sections is this script made of?">&#x1F4E6; Overview</span>
      <span class="nc-dev-ai-chip" data-q="How does the account system work?">&#x1F464; Accounts</span>
      <span class="nc-dev-ai-chip" data-q="How do I add a new theme preset?">&#x1F3A8; Themes</span>
      <span class="nc-dev-ai-chip" data-q="How do I add a new tank entry?">&#x1F3AE; Tanks</span>
      <span class="nc-dev-ai-chip" data-q="How does password hashing work in this script?">&#x1F510; Passwords</span>
      <span class="nc-dev-ai-chip" data-q="How do I create a custom bot movement mod?">&#x1F9E9; Mods</span>
      <span class="nc-dev-ai-chip" data-q="How does the WebSocket connection work?">&#x1F50C; WebSocket</span>
      <span class="nc-dev-ai-chip" data-q="What localStorage keys does this script use?">&#x1F4BE; Storage</span>
      <span class="nc-dev-ai-chip" data-q="How do commands like ?spawn work?">&#x2328; Commands</span>
      <span class="nc-dev-ai-chip" data-q="How does the layout editor work?">&#x1F532; Layout</span>
    </div>
    <div id="ncDevAiLog">
      <div class="nc-dev-ai-msg bot"><span class="nc-dev-ai-label">&#x1F916; Script AI &mdash; Offline</span>Hey! I know everything about <strong>Noob Controller v0.25</strong> &mdash; fully offline, no API key, no internet needed.<br><br>Click a chip above or ask me anything about the script internals.</div>
    </div>
    <div id="ncDevAiThinking" style="display:none;">&#x1F7E2; Thinking&hellip;</div>
    <div class="nc-dev-ai-input-row">
      <input id="ncDevAiInput" placeholder="Ask anything about this script...">
      <button class="nc-dev-browser-btn" id="ncDevAiSend">&#x25B6; Ask</button>
    </div>
  </div>
  `;
  document.body.appendChild(dm);

  // ── Close
  document.getElementById("ncDevClose").addEventListener("click",()=>dm.classList.remove("open"));

  // ── Block game from receiving events inside dev menu
  dm.addEventListener("keydown",e=>e.stopPropagation());
  dm.addEventListener("keyup",e=>e.stopPropagation());
  dm.addEventListener("mousedown",e=>e.stopPropagation());
  dm.addEventListener("mouseup",e=>e.stopPropagation());
  dm.addEventListener("click",e=>e.stopPropagation());

  // ── Keybind: Ctrl+Shift+D
  document.addEventListener("keydown",e=>{
    if(e.ctrlKey&&e.shiftKey&&e.key==="D"){e.preventDefault();dm.classList.toggle("open");}
  });

  // ── Tabs
  dm.querySelectorAll(".nc-dev-tab").forEach(tab=>{
    tab.addEventListener("click",()=>{
      dm.querySelectorAll(".nc-dev-tab").forEach(t=>t.classList.remove("active"));
      dm.querySelectorAll(".nc-dev-panel").forEach(p=>p.classList.remove("active"));
      tab.classList.add("active");
      dm.querySelector(`.nc-dev-panel[data-panel="${tab.dataset.tab}"]`).classList.add("active");
      if(tab.dataset.tab==="storage")ncDevLsRefresh();
    });
  });

  // ── Notes
  const notesEl=document.getElementById("ncDevNotes");
  const notesSave=document.getElementById("ncDevNotesSave");
  notesEl.value=localStorage.getItem(NC_DEV_NOTES_KEY)||"";
  let notesTimer=null;
  notesEl.addEventListener("input",()=>{
    clearTimeout(notesTimer);
    notesSave.textContent="Saving...";notesSave.className="nc-dev-notes-status";
    notesTimer=setTimeout(()=>{
      localStorage.setItem(NC_DEV_NOTES_KEY,notesEl.value);
      notesSave.textContent="✅ Saved";notesSave.className="nc-dev-notes-status ok";
      setTimeout(()=>{notesSave.textContent="";},2000);
    },800);
  });
  document.getElementById("ncDevNotesClear").addEventListener("click",()=>{
    if(!confirm("Clear all notes?"))return;
    notesEl.value="";localStorage.removeItem(NC_DEV_NOTES_KEY);
    notesSave.textContent="🗑 Cleared";notesSave.className="nc-dev-notes-status";
  });

  // ── Browser
  const frame=document.getElementById("ncDevBrowserFrame");
  const urlInput=document.getElementById("ncDevBrowserUrl");
  function ncDevBrowserNav(url){
    if(!url.startsWith("http"))url="https://"+url;
    urlInput.value=url;frame.src=url;
  }
  document.getElementById("ncDevBrowserGo").addEventListener("click",()=>ncDevBrowserNav(urlInput.value.trim()));
  urlInput.addEventListener("keydown",e=>{if(e.key==="Enter")ncDevBrowserNav(urlInput.value.trim());});
  document.getElementById("ncDevBrowserBack").addEventListener("click",()=>{try{frame.contentWindow.history.back();}catch{frame.src=frame.src;}});
  document.getElementById("ncDevBrowserRefresh").addEventListener("click",()=>{frame.src=frame.src;});
  dm.querySelectorAll(".nc-dev-browser-preset").forEach(p=>{
    p.addEventListener("click",()=>ncDevBrowserNav(p.dataset.url));
  });

  // ── Console
  const consoleLog=document.getElementById("ncDevConsoleLog");
  const consoleInput=document.getElementById("ncDevConsoleInput");
  const consoleHistory=[];let histIdx=-1;
  function ncDevConLog(text,cls){
    const line=document.createElement("div");line.className="nc-dev-con-line "+cls;line.textContent=text;
    consoleLog.appendChild(line);consoleLog.scrollTop=consoleLog.scrollHeight;
  }
  function ncDevConRun(){
    const code=consoleInput.value.trim();if(!code)return;
    consoleHistory.unshift(code);histIdx=-1;
    ncDevConLog("> "+code,"nc-dev-con-prompt");
    try{
      const result=eval(code);
      const out=result===undefined?"undefined":JSON.stringify(result,null,2)||String(result);
      ncDevConLog("← "+out,"nc-dev-con-out");
    }catch(e){ncDevConLog("✗ "+e.message,"nc-dev-con-err");}
    consoleInput.value="";
  }
  document.getElementById("ncDevConsoleRun").addEventListener("click",ncDevConRun);
  consoleInput.addEventListener("keydown",e=>{
    if(e.key==="Enter"){ncDevConRun();}
    else if(e.key==="ArrowUp"){e.preventDefault();if(histIdx<consoleHistory.length-1){histIdx++;consoleInput.value=consoleHistory[histIdx];}}
    else if(e.key==="ArrowDown"){e.preventDefault();if(histIdx>0){histIdx--;consoleInput.value=consoleHistory[histIdx];}else{histIdx=-1;consoleInput.value="";}}
  });
  document.getElementById("ncDevConsoleClear").addEventListener("click",()=>{consoleLog.innerHTML='<div class="nc-dev-con-line nc-dev-con-info">// Cleared</div>';});

  // ── LocalStorage viewer
  function ncDevLsRefresh(){
    const tbody=document.getElementById("ncDevLsBody");tbody.innerHTML="";
    const keys=Object.keys(localStorage).sort();
    if(keys.length===0){tbody.innerHTML='<tr><td colspan="3" style="color:#5a5880;text-align:center;padding:16px;">No localStorage entries.</td></tr>';return;}
    keys.forEach(k=>{
      const val=localStorage.getItem(k);
      const short=val&&val.length>80?val.slice(0,80)+"…":val;
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${k}</td><td title="${val?val.replace(/"/g,"&quot;"):""}">${short||"(empty)"}</td><td><button class="nc-dev-ls-del" data-key="${k}">🗑</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll(".nc-dev-ls-del").forEach(btn=>{
      btn.addEventListener("click",()=>{
        if(!confirm("Delete "+btn.dataset.key+"?"))return;
        localStorage.removeItem(btn.dataset.key);ncDevLsRefresh();
      });
    });
  }
  document.getElementById("ncDevLsRefresh").addEventListener("click",ncDevLsRefresh);
  document.getElementById("ncDevLsExport").addEventListener("click",()=>{
    const data={};Object.keys(localStorage).forEach(k=>data[k]=localStorage.getItem(k));
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="nc_localstorage_export.json";a.click();
  });

  // ── Script AI
  const NC_SCRIPT_SYSTEM = `You are an expert AI assistant embedded inside the Noob Controller Tampermonkey userscript (v0.25) for arras.io. You have deep knowledge of the entire script's internals and can explain, guide, and generate code for it.

KEY SCRIPT SECTIONS & HOW THEY WORK:
1. MSGPACK (line 25): Custom MessagePack encoder/decoder for binary WebSocket comms with the arras.io bot server. encode(v) / decode(buf).
2. THEME SYSTEM (line 104): CSS variables stored in THEME_TOKENS array. THEME_PRESETS object has named presets. applyTheme(obj) sets CSS vars on :root. persistTheme(obj) saves to localStorage key "noobController_theme". To add a preset: add a key to THEME_PRESETS with CSS variable overrides.
3. ACCOUNT SYSTEM (line 459): Accounts stored in localStorage key "noobController_accounts_v4". Roles: owner, beta, free, demo. Passwords are SHA-256 hashed via ncHashPassword(plain) using Web Crypto API. ncLoadAccounts() loads from localStorage or returns seed. ncSaveAccounts(arr) saves. ncFindAccount(user,pass) async - hashes password then compares.
4. LOGIN (line 586): ncShowLogin() builds overlay. attemptLogin() is async, calls ncFindAccount. Session saved as username string in localStorage "noobController_session".
5. ROLE PERMISSIONS (line 644): owner/beta get full access. free users: only music, guide, bot controls. demo: same as free but all inputs disabled. NC_FREE_LOCKED_BTNS and NC_FREE_LOCKED_PANELS arrays define what gets removed.
6. OWNER PANEL (line 836): ncRefreshOwnerPanel() rebuilds the account manager UI. ncBuildOwnerPanel() creates the panel DOM once.
7. DEV MENU (line 1013): Owner-only panel with Notes, Browser, Console, Storage, Script AI tabs. Opened via 🛠 Dev button or Ctrl+Shift+D.
8. MENU HTML (line 1327): Full menu built as innerHTML string on a fixed-position div#scriptMenu.
9. SERVER SYSTEM (line 2058): servers[] array of {id,type,ws,dot,urlInput,connectBtn}. addServer(type, url, label) creates a row and opens WebSocket. Types: "local" (ws://localhost:8082) or "codespace" (custom URL). Saved to localStorage "noobController_savedServers".
10. PACKET HELPERS (line 2127): sendTo(ws,...args) sends msgpack. packet(...args) broadcasts to all servers. Bot handshake: onopen sends "M",72011. onmessage receives "M" type, responds with "C", data^845, then "Z" with tank name.
11. TANK SYSTEM (line 2132): tanks object {key:{name,tanks?[]}}. TANKS_DEFAULT is the base. rebuildTankSelect() refreshes the dropdown. packet("Z", tankName) switches bots. ?tank command uses alias map.
12. MOD SYSTEM (line 2236): registerMod({name,icon,description,tick}) registers movement mods. tick(ctx) returns {bx,by}. ctx has {x,y,mouseX,mouseY,mouseDown,rMouseDown,keys}. Active mod overrides all movement modes.
13. KEYS & MOUSE (line 2284): Global keydown listener tracks keys{}. Fixed to skip input/textarea elements. mouseX/mouseY tracked via game canvas mousemove intercept.
14. BROADCAST LOOP (line 2312): setInterval sends movement packets. Priority: active mod > autoRotate > stayPut > growthMode > normal (mouse follow at 1/15 scale).
15. COMMAND PROMPT (line 2324): runCmd(str) parses ?spawn, ?kill, ?tank, ?feed, ?mode, ?list, ?help commands.
16. MEDIA PLAYER (line 2569): Supports direct audio/video URLs. YouTube opens in new tab (CSP blocks embedding).
17. LAYOUT EDITOR (line 2902): sectionOrder[] and hiddenSections Set control drag/drop panel ordering. saveLayout() persists to localStorage.

COMMON CHANGES PEOPLE WANT TO MAKE:
- Add a theme preset: Add to THEME_PRESETS object with CSS variable keys from THEME_TOKENS
- Add a tank: Add key to TANKS_DEFAULT with {name:"Display Name"} or {name:"Group",tanks:["tank1","tank2"]}
- Add an account: Push to NC_ACCOUNTS array (password must be SHA-256 hashed) then call ncSaveAccounts()
- Change bot speed: Modify the 1/15 scale factor in the broadcast loop (mouseX/15, mouseY/15)
- Add a movement mod: Call registerMod({name,icon,description,tick:ctx=>({bx,by})})
- Add a command: Add a case in the runCmd() switch/if chain
- Change menu width: Default is 600px, set in menu.style or via Layout panel slider
- Add a new role: Add to NC_ROLE_COLORS, NC_ROLE_BADGES, NC_ROLE_LABELS, NC_ROLE_PERMS

LOCALSTORAGE KEYS USED:
- "noobController_theme" - active theme CSS vars
- "noobController_userThemes" - user-saved custom themes  
- "noobController_savedServers" - saved server URLs
- "noobController_font" - selected font key
- "noobController_accounts_v4" - accounts array (passwords SHA-256 hashed)
- "noobController_session" - logged-in username
- "noobController_suggestions" - beta user suggestions
- "noobController_devNotes" - dev menu personal notes
- "noobController_layout" - section order, hidden sections, width, opacity

Always provide working JavaScript code examples when relevant. When showing how to modify the script, reference the actual variable names and function names above. Be concise but thorough.`;

  const ncDevAiHistory = [];

  function ncDevAiAppend(role, text) {
    const log = document.getElementById("ncDevAiLog");
    if (!log) return;
    const div = document.createElement("div");
    div.className = "nc-dev-ai-msg " + role;
    if (role === "bot") {
      // Render markdown-ish: code blocks, inline code, bold
      let html = text
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code)=>`<pre>${code.trim()}</pre>`)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      div.innerHTML = `<span class="nc-dev-ai-label">🤖 Script AI</span>${html}`;
    } else {
      div.textContent = text;
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  // ── OFFLINE AI ENGINE ─────────────────────────────────────────────────────
  // Fully offline — no API key, no internet. All knowledge is baked in.
  const NC_OFFLINE_KB = [
    { keys:["msgpack","encode","decode","binary","serialize","pack","unpack","buffer"],
      answer:`**MsgPack** (line 25) — custom binary serializer, no library needed.\n\n\`\`\`js\nconst bytes = msgpack.encode({ x: 100, y: 200 });\nconst obj   = msgpack.decode(bytes);\n\`\`\`\n\nSupported: null, boolean, integer, float64, string, Array, Object.\nUsed internally by \`sendTo(ws, ...args)\` for WebSocket comms with the bot server.`},

    { keys:["theme","preset","color","colour","colors","skin","appearance","css variable","--dc","palette"],
      answer:`**Theme System** (line 104) — CSS variables on \`:root\`, saved to localStorage.\n\n**Add a custom preset via Console tab:**\n\`\`\`js\nconst themes = JSON.parse(localStorage.getItem("noobController_userThemes") || "{}");\nthemes["My Theme"] = {\n  "--dc-bg-primary":    "#1a1a2e",\n  "--dc-bg-secondary":  "#16213e",\n  "--dc-blurple":       "#e94560",\n  "--dc-text-normal":   "#eaeaea"\n};\nlocalStorage.setItem("noobController_userThemes", JSON.stringify(themes));\nlocation.reload();\n\`\`\`\n\nBuilt-in presets: Discord, Midnight, Forest, Rose Gold, Slate, Catppuccin, ~AS Clan, ~AS Red.\nKey functions: \`applyTheme(obj)\`, \`persistTheme(obj)\`.`},

    { keys:["account","accounts","password","login","user","username","session","sha","hash","register","sign in","signup"],
      answer:`**Account System** (line 459) — stored in \`localStorage\` key \`"noobController_accounts_v4"\`.\n\nRoles: \`owner\` (full) | \`beta\` (suggest panel) | \`free\` (limited) | \`demo\` (frozen UI) | \`guest\` (no session).\n\n**Add an account via Console tab:**\n\`\`\`js\nconst hashed = await ncHashPassword("mypassword");\nconst accs = JSON.parse(localStorage.getItem("noobController_accounts_v4") || "[]");\naccs.push({ username: "newuser", password: hashed, role: "beta" });\nlocalStorage.setItem("noobController_accounts_v4", JSON.stringify(accs));\n\`\`\`\n\nKey functions: \`ncHashPassword(plain)\` (SHA-256), \`ncFindAccount(user,pass)\`, \`ncLoadAccounts()\`, \`ncSaveAccounts(arr)\`.`},

    { keys:["role","permission","restrict","free","beta","owner","demo","guest","locked","access"],
      answer:`**Role Permissions** (line 644):\n\n- **owner** — Everything + Dev Menu + Account Manager\n- **beta** — Full controls + Suggest panel\n- **free** — Basic bot controls only\n- **demo** — UI visible but all inputs frozen (guided tour)\n- **guest** — Same as free, no session saved\n\nElements removed for free users are in \`NC_FREE_LOCKED_BTNS\` and \`NC_FREE_LOCKED_PANELS\` arrays.\n\n**Change a role via Console:**\n\`\`\`js\nconst accs = JSON.parse(localStorage.getItem("noobController_accounts_v4") || "[]");\nconst acc = accs.find(a => a.username === "alice");\nif (acc) { acc.role = "beta"; localStorage.setItem("noobController_accounts_v4", JSON.stringify(accs)); }\n\`\`\``},

    { keys:["server","websocket","ws","wss","codespace","localhost","connect","reconnect","addserver","port","8082"],
      answer:`**Server System** (line 2058) — manages WebSocket connections to bot servers.\n\nEach server row: \`{id, type, ws, dot, urlInput, connectBtn}\`.\nTypes: \`"local"\` (ws://localhost:8082) or \`"codespace"\` (custom wss://).\nSaved to localStorage key \`"noobController_savedServers"\`.\n\n**Add server via Console:**\n\`\`\`js\naddServer("codespace", "wss://your-space-8082.preview.app.github.dev", "My Space");\n\`\`\`\n\n**Errors:**\n- Red dot / 1006 error → Port is Private — set it Public in Codespaces.\n- Yellow dot stuck → URL changed after restart — update it in the row.\n- Bots don't spawn → Server hash doesn't match the game room.`},

    { keys:["spawn","bot","noob","kill","delete","count","spawnmulti","connectnoob","botcount","spawnning"],
      answer:`**Spawning bots:**\n\n- **Connect 1** (\`#connectNoob\`) — spawns one bot.\n- **Spawn Multi** (\`#spawnMulti\`) — spawns \`#botCount\` bots.\n- **Kill All** (\`#deleteNoobs\`) — disconnects all bots.\n\n**Via command prompt:**\n\`\`\`\n?spawn ca 50 tri-angle\n?spawn abc123 10 drones\n?kill\n\`\`\`\n\n**Bot handshake flow** (line 2127):\n1. WebSocket opens → send \`"M", 72011\`\n2. Server replies \`"M"\` → respond \`"C", data^845\`\n3. Send \`"Z", tankName\` to spawn.\n\nUse \`packet(...args)\` to broadcast to ALL servers.`},

    { keys:["tank","tanks","select","tankselect","rebuildtankselect","alias","tanksdefault","class","tank type"],
      answer:`**Tank System** (line 2132) — \`TANKS_DEFAULT\` maps keys to \`{name}\` or \`{name, tanks:[]}\`.\n\n**Switch tank:**\n\`\`\`js\npacket("Z", "tri-angle");  // all bots\n\`\`\`\n\n**Or via command:**\n\`\`\`\n?tank drones\n?tank basic\n\`\`\`\n\n**Add a tank via Console:**\n\`\`\`js\nTANKS_DEFAULT["mytank"] = { name: "My Custom Tank" };\nrebuildTankSelect();\n\`\`\`\n\nUse \`?list tanks\` in the CMD bar to print all aliases.`},

    { keys:["mode","autorotate","stayput","growth","rotate","movement","move","position","follow","mouse","speed"],
      answer:`**Movement Modes** (broadcast loop, line 2312):\n\n- **Auto-Rotate** — bots orbit around you over time\n- **Stay Put** — bots hold their position\n- **Growth Mode** — bots move toward your world coords\n- **Normal** (default) — bots follow your mouse at 1/15 scale\n\n**Via command:**\n\`\`\`\n?mode rotate\n?mode stayput\n?mode growth\n?mode normal\n\`\`\`\n\n**Change bot follow speed:**\nFind the setInterval at line 2312 and edit the \`/15\` divisor — lower = faster.`},

    { keys:["mod","mods","registermod","tick","repel","charge","jitter","movement mod","custom mod","registermmod"],
      answer:`**Mod System** (line 2236) — register custom movement behaviours.\n\n\`\`\`js\nregisterMod({\n  name: "Spiral",\n  icon: "🌀",\n  description: "Bots spiral outward",\n  tick: (ctx) => {\n    const t = Date.now() / 500;\n    return { bx: Math.cos(t) * 100, by: Math.sin(t) * 100 };\n  }\n});\n\`\`\`\n\n**ctx contains:** \`x\`, \`y\` (bot position), \`mouseX\`, \`mouseY\`, \`mouseDown\`, \`rMouseDown\`, \`keys\`.\n\nBuilt-in mods: Repel, Charge, Jitter. Active mod overrides all other modes.`},

    { keys:["command","cmd","prompt","runcmd","?spawn","?kill","?tank","?feed","?mode","?list","?help"],
      answer:`**Command Prompt** (line 2324) — type in the CMD bar below the log.\n\n| Command | Effect |\n|---------|--------|\n| \`?spawn <hash> <count> [tank]\` | Spawn bots |\n| \`?kill\` | Kill all bots |\n| \`?tank <name>\` | Switch tank |\n| \`?feed on/off\` | Toggle feeding |\n| \`?mode rotate/stayput/growth/normal\` | Movement mode |\n| \`?list tanks\` | Print all aliases |\n| \`?help\` | Show reference |\n\n**Add a custom command** — find \`runCmd(str)\` at line 2324:\n\`\`\`js\nif (str === "?mycommand") { log("fired!"); return; }\n\`\`\``},

    { keys:["localstorage","storage","save","persist","key","keys","data","export","import","local storage"],
      answer:`**localStorage keys used by this script:**\n\n- \`noobController_theme\` — active theme CSS vars\n- \`noobController_userThemes\` — user-saved custom themes\n- \`noobController_savedServers\` — saved server URLs\n- \`noobController_font\` — selected font key\n- \`noobController_accounts_v4\` — accounts (SHA-256 passwords)\n- \`noobController_session\` — logged-in username\n- \`noobController_suggestions\` — beta user suggestions\n- \`noobController_devNotes\` — dev menu notes\n- \`noobController_layout\` — section order/hidden/width/opacity\n\n**Reset everything via Console:**\n\`\`\`js\nObject.keys(localStorage).filter(k=>k.startsWith("noobController")).forEach(k=>localStorage.removeItem(k));\nlocation.reload();\n\`\`\``},

    { keys:["dev menu","developer","dev","devmenu","ncdevmenu","ctrl shift","shortcut","owner only","panel tab"],
      answer:`**Dev Menu** (line 1013) — Owner-only panel.\n\nOpen via: 🛠 Dev button in title bar, or \`Ctrl+Shift+D\`.\n\n**Tabs:**\n- 📝 **Notes** — scratchpad, auto-saved to localStorage\n- 🌐 **Browser** — embedded iframe\n- ⌨️ **Console** — run JS in the page context\n- 💾 **Storage** — view/delete localStorage keys\n- 🤖 **Script AI** — this panel (offline!)\n\n**Open via Console:**\n\`\`\`js\ndocument.getElementById("ncDevMenu").classList.add("open");\n\`\`\``},

    { keys:["layout","section","order","drag","reorder","hide","visible","width","opacity","panel order"],
      answer:`**Layout Editor** (line 2902) — drag-and-drop section reordering + visibility.\n\nState: \`sectionOrder[]\` + \`hiddenSections\` Set. Saved to localStorage key \`"noobController_layout"\`.\n\n**Reset layout via Console:**\n\`\`\`js\nlocalStorage.removeItem("noobController_layout");\nlocation.reload();\n\`\`\`\n\n**Hide a section:**\n\`\`\`js\nhiddenSections.add("_servers");\napplyLayout();\n\`\`\`\n\nDefault: 600px width, 100% opacity.`},

    { keys:["media","music","player","audio","video","youtube","song","url","mp3","mp4","media player"],
      answer:`**Media Player** (line 2569) — paste any direct audio/video URL.\n\n- **Direct URLs** (mp3, ogg, mp4) → plays in an \`<audio>\` element inside the panel.\n- **YouTube URLs** → opens in a new tab (CSP blocks embedding).\n\nAccess via 🎵 Music button in the title bar.`},

    { keys:["font","typeface","typography","inter","ubuntu","comic sans","noto","gg sans","whitney","ggsans"],
      answer:`**Font System** (line 136) — saved to localStorage key \`"noobController_font"\`.\n\nAvailable: \`inter\`, \`ubuntu\`, \`comicsans\`, \`noto\`, \`ggsans\`, \`whitney\`.\n\n**Change font via Console:**\n\`\`\`js\nlocalStorage.setItem("noobController_font", "ubuntu");\napplyFont("ubuntu");\n\`\`\``},

    { keys:["packet","sendto","broadcast","websocket send","packet helper","binary send","ws send"],
      answer:`**Packet Helpers** (line 2127):\n\n\`\`\`js\nsendTo(ws, "Z", "basic");    // send to specific WebSocket\npacket("Z", "tri-angle");   // broadcast to ALL servers\n\`\`\`\n\nAll values are MsgPack-encoded before sending.\n\n**Handshake sequence:**\n1. \`onopen\` → \`sendTo(ws, "M", 72011)\`\n2. Server replies "M" → \`sendTo(ws, "C", data ^ 845)\`\n3. Then \`sendTo(ws, "Z", tankName)\` to spawn.`},

    { keys:["version","v0.25","what is","about","info","noob controller","overview","script","tampermonkey","violentmonkey","userscript","arras","general"],
      answer:`**Noob Controller v0.25** — Violentmonkey/Tampermonkey userscript for **arras.io**.\n\nIt connects to an external bot server (local or GitHub Codespace) to spawn and control bots in arras.io game rooms.\n\n**Main sections:**\n1. MsgPack encoder/decoder (binary WebSocket comms)\n2. Theme system (CSS variables, presets, custom themes)\n3. Account system (login, roles, SHA-256 passwords)\n4. Dev Menu (Notes, Browser, Console, Storage, Script AI)\n5. Server manager (WebSocket connections)\n6. Bot controls (spawn, kill, movement modes)\n7. Tank system (select, switch, aliases)\n8. Mod system (custom movement behaviours)\n9. Command prompt (?spawn, ?kill, ?tank, etc.)\n10. Media player\n11. Layout editor (drag-and-drop sections)\n\nAsk me about any section!`},
  ];

  function ncOfflineScore(q, entry) {
    let score = 0;
    const ql = q.toLowerCase();
    const words = ql.split(/\s+/);
    for (const kw of entry.keys) {
      if (ql.includes(kw)) score += kw.split(" ").length * 2;
      for (const w of words) { if (w.length > 2 && kw.includes(w)) score += 0.5; }
    }
    return score;
  }

  function ncOfflineAnswer(question) {
    const q = question.trim();
    if (/^(hi|hey|hello|sup|yo|hiya|howdy)[\s!?.]*$/i.test(q))
      return "Hey! 👋 I'm the **Script AI** — fully offline, no internet needed.\n\nI know every part of Noob Controller v0.25. Ask me about themes, accounts, servers, bots, tanks, mods, commands, localStorage, the dev menu, layout — anything in the script!";
    if (/thank|thanks|ty|thx/i.test(q))
      return "No problem! Ask me anything else about the script. 🟢";

    const scored = NC_OFFLINE_KB.map(e => ({ e, s: ncOfflineScore(q, e) })).filter(x => x.s > 0);
    scored.sort((a, b) => b.s - a.s);

    if (scored.length === 0)
      return "Hmm, not sure about that one. Try asking about:\n\n`theme` · `accounts` · `roles` · `server` · `websocket` · `spawn` · `tanks` · `mods` · `commands` · `localStorage` · `layout` · `font` · `msgpack` · `dev menu`\n\nOr describe what you want to change!";

    let answer = scored[0].e.answer;
    if (scored.length > 1 && scored[1].s >= scored[0].s * 0.7 && scored[0].s < 5)
      answer += "\n\n---\n\n**Also related:**\n\n" + scored[1].e.answer;
    return answer;
  }

  function ncDevAiSend(question) {
    if (!question.trim()) return;
    const input = document.getElementById("ncDevAiInput");
    const thinking = document.getElementById("ncDevAiThinking");
    const sendBtn = document.getElementById("ncDevAiSend");
    if (input) input.value = "";
    if (sendBtn) sendBtn.disabled = true;
    ncDevAiAppend("user", question);
    if (thinking) { thinking.textContent = "🟢 Thinking…"; thinking.style.display = "block"; }
    setTimeout(() => {
      try {
        const reply = ncOfflineAnswer(question);
        ncDevAiHistory.push({role:"user", content: question});
        ncDevAiHistory.push({role:"assistant", content: reply});
        ncDevAiAppend("bot", reply);
      } catch(e) {
        ncDevAiAppend("bot", "❌ Error: " + e.message);
      } finally {
        if (thinking) thinking.style.display = "none";
        if (sendBtn) sendBtn.disabled = false;
      }
    }, 120);
  }

  // Wire up after DOM built
  setTimeout(()=>{
    const input = document.getElementById("ncDevAiInput");
    const sendBtn = document.getElementById("ncDevAiSend");
    if (!input || !sendBtn) return;
    sendBtn.addEventListener("click", ()=>ncDevAiSend(input.value.trim()));
    input.addEventListener("keydown", e=>{
      if(e.key==="Enter"){e.stopPropagation();ncDevAiSend(input.value.trim());}
    });
    document.querySelectorAll(".nc-dev-ai-chip").forEach(chip=>{
      chip.addEventListener("click",()=>ncDevAiSend(chip.dataset.q));
    });
  }, 100);

}

// ─── GLOBAL GROUP CHAT ────────────────────────────────────────────────────────
// Firebase Realtime Database — shared across ALL computers/browsers
// 🔧 SETUP: Change the topic below to any unique name (keep it secret — it's your chat room!)
//    Share the same script (with the same topic) with your friends and you're done.
//    Uses ntfy.sh — completely free, no account, no database needed.
const NC_NTFY_TOPIC="nc-7777-gchat-x9k2m"; // secret group chat topic — share script as-is, do NOT post this publicly
const NC_NTFY_URL=`https://ntfy.sh/${NC_NTFY_TOPIC}`;
const NC_CHAT_MAX=200; // max messages to keep in memory
let _chatOpen=false;
let _chatLastCount=0;
let _chatPollTimer=null;
let _chatMessages=[]; // local cache of received messages
let _chatEventSource=null; // SSE connection for real-time receive

// ── ntfy.sh helpers ──
async function ncNtfySend(data){
  try{
    const r=await fetch(NC_NTFY_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json","Title":"nc-chat"},
      body:JSON.stringify(data)
    });
    return r.ok;
  }catch{return false;}
}

function ncNtfyConnect(){
  // Use Server-Sent Events for instant real-time messages
  if(_chatEventSource)_chatEventSource.close();
  _chatEventSource=new EventSource(`${NC_NTFY_URL}/sse`);
  _chatEventSource.addEventListener("message",e=>{
    try{
      const raw=JSON.parse(e.data);
      if(!raw.message)return;
      const msg=JSON.parse(raw.message);
      if(!msg||!msg.ts||!msg.text)return;
      // Avoid duplicates (we append locally on send)
      const alreadyHave=_chatMessages.some(m=>m.ts===msg.ts&&m.username===msg.username&&m.text===msg.text);
      if(alreadyHave)return;
      _chatMessages.push(msg);
      if(_chatMessages.length>NC_CHAT_MAX)_chatMessages.splice(0,_chatMessages.length-NC_CHAT_MAX);
      ncChatRender();
      if(!_chatOpen){
        const badge=document.getElementById("ncChatUnread");
        if(badge){
          const cur=parseInt(badge.textContent)||0;
          const next=cur+1;
          badge.textContent=next>9?"9+":next;
          badge.classList.add("visible");
        }
      }
    }catch{}
  });
  _chatEventSource.onerror=()=>{
    // Auto-reconnect after 3s if disconnected
    setTimeout(()=>{if(_chatEventSource.readyState===EventSource.CLOSED)ncNtfyConnect();},3000);
  };
}

// ── Chat load/save (local only now — ntfy handles sync) ──
async function ncChatLoad(){
  return _chatMessages;
}
async function ncChatSave(msgs){}

function ncChatTimestamp(ts){
  const d=new Date(ts);
  const h=d.getHours().toString().padStart(2,"0"),m=d.getMinutes().toString().padStart(2,"0");
  return`${h}:${m}`;
}

function ncChatRoleColor(role){return NC_ROLE_COLORS[role]||"#949ba4";}
function ncChatRoleBadge(role){
  const map={owner:"👑 Owner",beta:"🧪 Beta",free:"🆓 Free",demo:"🎮 Demo",guest:"👤 Guest"};
  return map[role]||role;
}

function ncBuildChatPanel(){
  if(document.getElementById("ncChatPanel"))return;
  const panel=document.createElement("div");panel.id="ncChatPanel";
  panel.innerHTML=`
  <div class="nc-chat-header">
    <div class="nc-chat-header-left">
      <span class="nc-chat-title">💬 Global Chat</span>
      <span class="nc-chat-online" id="ncChatOnline">Offline</span>
    </div>
    <button class="nc-chat-close" id="ncChatClose">✕</button>
  </div>
  <div id="ncMemberListWrap" style="border-bottom:1px solid var(--dc-border-subtle);padding:6px 10px 8px;background:var(--dc-bg-secondary);">
    <div style="font-size:10px;font-weight:700;color:var(--dc-text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Online Members</div>
    <div id="ncMemberList" style="display:flex;flex-direction:column;gap:1px;max-height:90px;overflow-y:auto;"></div>
  </div>
  <div id="ncChatLog"></div>
  <div class="nc-chat-input-row">
    <input id="ncChatInput" placeholder="Send a message…" maxlength="300" autocomplete="off" spellcheck="false">
    <button id="ncChatSendBtn">Send</button>
  </div>`;
  document.body.appendChild(panel);

  document.getElementById("ncChatClose").addEventListener("click",()=>ncToggleChat(false));
  document.getElementById("ncChatSendBtn").addEventListener("click",ncChatSend);
  document.getElementById("ncChatInput").addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();e.stopPropagation();ncChatSend();}
  });
  // block game keys while typing in chat
  document.getElementById("ncChatInput").addEventListener("keydown",e=>e.stopPropagation());
  document.getElementById("ncChatInput").addEventListener("keyup",e=>e.stopPropagation());

  ncChatRender();
}

function ncChatRender(scrollToBottom=false){
  const log=document.getElementById("ncChatLog");
  if(!log)return;
  const msgs=_chatMessages; // use local cache (kept fresh by poll)
  const me=window._ncCurrentAcc;
  const myName=me?(me.displayName||me.username):"Guest";

  if(msgs.length===0){
    log.innerHTML=`<div class="nc-chat-empty">No messages yet — say hi! 👋</div>`;
  } else {
    const wasAtBottom=log.scrollHeight-log.scrollTop-log.clientHeight<40;
    log.innerHTML="";
    msgs.forEach(msg=>{
      if(msg.type==="system"){
        const d=document.createElement("div");d.className="nc-chat-system";d.textContent=msg.text;log.appendChild(d);return;
      }
      const isOwn=msg.displayName===myName||msg.username===myName;
      const roleColor=ncChatRoleColor(msg.role);
      const d=document.createElement("div");d.className="nc-chat-msg"+(isOwn?" own":"");
      d.innerHTML=`<div class="nc-chat-msg-header"><span class="nc-chat-msg-name" style="color:${roleColor};">${escHtml(msg.displayName||msg.username)}</span><span class="nc-chat-msg-role" style="background:${roleColor}22;color:${roleColor};">${ncChatRoleBadge(msg.role)}</span><span class="nc-chat-msg-time">${ncChatTimestamp(msg.ts)}</span></div><div class="nc-chat-msg-text">${escHtml(msg.text)}</div>`;
      log.appendChild(d);
    });
    if(scrollToBottom||wasAtBottom)log.scrollTop=log.scrollHeight;
  }

  // Update unread badge
  if(!_chatOpen&&msgs.length>_chatLastCount){
    const unread=msgs.length-_chatLastCount;
    const badge=document.getElementById("ncChatUnread");
    if(badge){badge.textContent=unread>9?"9+":unread;badge.classList.add("visible");}
  }
}

function escHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

function ncChatSend(){
  const input=document.getElementById("ncChatInput");
  if(!input)return;
  const text=input.value.trim();
  if(!text)return;
  const me=window._ncCurrentAcc;
  input.value="";
  const msg={
    username:me?(me.username):"Guest",
    displayName:me?(me.displayName||me.username):"Guest",
    role:me?me.role:"guest",
    text,
    ts:Date.now()
  };
  // Send via ntfy.sh (for cross-browser sync)
  ncNtfySend(msg).then(ok=>{
    if(!ok)showToast("\u274c Chat send failed (ntfy)",true);
  });
  // Also send via bot WebSocket so server relays to all bot-server clients
  ncChatSendViaWS(msg);
  // Append locally for instant feedback
  _chatMessages.push(msg);
  ncChatRender(true);
}

function ncChatSendViaWS(msg){
  // Send through bot WebSocket — server will broadcast to all connected clients
  if(typeof servers !== "undefined"){
    for(const entry of servers){
      const ws=entry.ws;
      if(ws&&ws.readyState===WebSocket.OPEN){
        try{
          ws.send(msgpack.encode(["CHAT",msg.text,msg.username,msg.role,msg.ts]));
        }catch(e){}
        break; // only need one — server broadcasts to everyone else
      }
    }
  }
}

function ncToggleChat(force){
  _chatOpen=force!==undefined?force:!_chatOpen;
  const panel=document.getElementById("ncChatPanel");
  const btn=document.getElementById("ncChatBtn");
  if(!panel)return;
  panel.classList.toggle("open",_chatOpen);
  if(btn)btn.style.color=_chatOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";
  if(_chatOpen){
    // Clear unread
    const badge=document.getElementById("ncChatUnread");
    if(badge){badge.textContent="";badge.classList.remove("visible");}
    ncChatLoad().then(msgs=>{
      _chatLastCount=msgs.length;
      ncChatRender(true);
    });
    setTimeout(()=>{const inp=document.getElementById("ncChatInput");if(inp)inp.focus();},50);
  }
}

function ncChatStartPoll(){
  // Connect via SSE for real-time messages (replaces polling)
  ncNtfyConnect();
  // Start presence heartbeat (announce ourselves as online)
  ncPresenceStart();
}

// ── Presence / Member List ──
// Each client broadcasts a heartbeat every 20s via ntfy.sh
// Anyone not seen for 45s is considered offline
const NC_PRESENCE_TOPIC=NC_NTFY_TOPIC+"-presence";
const NC_PRESENCE_URL=`https://ntfy.sh/${NC_PRESENCE_TOPIC}`;
const NC_PRESENCE_TTL=45000; // 45s — considered offline if no heartbeat
const NC_PRESENCE_INTERVAL=20000; // send heartbeat every 20s
let _presenceMembers={}; // { username: { displayName, role, lastSeen } }
let _presenceTimer=null;
let _presenceEventSource=null;

function ncPresenceSend(){
  const me=window._ncCurrentAcc;
  if(!me)return;
  const payload={
    type:"heartbeat",
    username:me.username,
    displayName:me.displayName||me.username,
    role:me.role||"guest",
    ts:Date.now()
  };
  fetch(NC_PRESENCE_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json","Title":"nc-presence"},
    body:JSON.stringify(payload)
  }).catch(()=>{});
}

function ncPresenceConnect(){
  if(_presenceEventSource)_presenceEventSource.close();
  _presenceEventSource=new EventSource(`${NC_PRESENCE_URL}/sse`);
  _presenceEventSource.addEventListener("message",e=>{
    try{
      const raw=JSON.parse(e.data);
      if(!raw.message)return;
      const data=JSON.parse(raw.message);
      if(!data||data.type!=="heartbeat"||!data.username)return;
      _presenceMembers[data.username]={
        displayName:data.displayName||data.username,
        role:data.role||"guest",
        lastSeen:Date.now()
      };
      ncPresenceRender();
    }catch{}
  });
  _presenceEventSource.onerror=()=>{
    setTimeout(()=>{if(_presenceEventSource.readyState===EventSource.CLOSED)ncPresenceConnect();},3000);
  };
}

function ncPresencePrune(){
  const now=Date.now();
  let changed=false;
  for(const u in _presenceMembers){
    if(now-_presenceMembers[u].lastSeen>NC_PRESENCE_TTL){
      delete _presenceMembers[u];
      changed=true;
    }
  }
  if(changed)ncPresenceRender();
}

function ncPresenceRender(){
  const members=Object.entries(_presenceMembers);
  // Update the online badge count
  const badge=document.getElementById("ncChatOnline");
  if(badge){
    const count=members.length;
    badge.textContent=count===0?"Offline":count===1?"1 Online":`${count} Online`;
  }
  // Render the member list panel
  const list=document.getElementById("ncMemberList");
  if(!list)return;
  if(members.length===0){
    list.innerHTML=`<div style="color:var(--dc-text-muted);font-size:12px;padding:6px 0;">No one online yet</div>`;
    return;
  }
  list.innerHTML="";
  members.sort((a,b)=>a[1].displayName.localeCompare(b[1].displayName));
  members.forEach(([username,info])=>{
    const roleColor=ncChatRoleColor(info.role);
    const d=document.createElement("div");
    d.style.cssText="display:flex;align-items:center;gap:7px;padding:4px 0;";
    d.innerHTML=`
      <span style="width:8px;height:8px;border-radius:50%;background:var(--dc-green);flex-shrink:0;display:inline-block;"></span>
      <span style="color:${roleColor};font-size:13px;font-weight:600;">${escHtml(info.displayName)}</span>
      <span style="font-size:10px;font-weight:700;background:${roleColor}22;color:${roleColor};border-radius:4px;padding:1px 5px;">${ncChatRoleBadge(info.role)}</span>`;
    list.appendChild(d);
  });
}

function ncPresenceStart(){
  ncPresenceConnect();
  // Send heartbeat immediately, then every 20s
  setTimeout(ncPresenceSend,500);
  _presenceTimer=setInterval(()=>{
    ncPresenceSend();
    ncPresencePrune();
  },NC_PRESENCE_INTERVAL);
  // Announce offline on page unload
  window.addEventListener("beforeunload",()=>{
    if(_presenceEventSource)_presenceEventSource.close();
  });
}

// ── Inject user badge into title bar after menu builds ──
function ncInjectUserBadge(acc){
  const titleBar=document.getElementById("ncTitleBar");
  if(!titleBar)return;
  const roleColor=NC_ROLE_COLORS[acc.role]||"#949ba4";
  const roleLabel=NC_ROLE_BADGES[acc.role]||acc.role;
  const displayName=acc.displayName||acc.username;
  const badge=document.createElement("div");badge.id="ncUserBadge";

  // Extra buttons based on role
  let extraBtns="";
  if(acc.role==="owner")extraBtns=`<span class="nc-owner-btn-wrap"><button id="ncOwnerPanelBtn" title="Account Manager" style="background:rgba(240,177,50,.18);border:1px solid #f0b13255;border-radius:4px;color:#f0b132;font-size:11px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;">👑 Accounts</button><span id="ncOwnerNotifBadge"></span></span><button id="ncDevMenuBtn" title="Developer Menu" style="background:rgba(0,255,136,.12);border:1px solid #00ff8855;border-radius:4px;color:#00ff88;font-size:11px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;">🛠 Dev</button>`;
  if(acc.role==="beta")extraBtns=`<button id="ncSuggestBtn" title="Submit Suggestion" style="background:rgba(88,101,242,.18);border:1px solid #5865f255;border-radius:4px;color:#7289da;font-size:11px;padding:3px 8px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;">💡 Suggest</button>`;

  badge.innerHTML=`<span style="color:var(--dc-text-normal);">${displayName}</span><span class="nc-badge-role" style="background:${roleColor}22;color:${roleColor};">${roleLabel}</span>${extraBtns}<button id="ncLogoutBtn" title="Sign out">↩ Logout</button>`;

  const statusDiv=document.getElementById("ncStatus");
  if(statusDiv)titleBar.querySelector("div").insertBefore(badge,statusDiv);
  else titleBar.appendChild(badge);

  document.getElementById("ncLogoutBtn").addEventListener("click",()=>{
    ncClearSession();menu.style.display="none";badge.remove();
    document.getElementById("ncOwnerPanel")?.remove();
    document.getElementById("ncSuggestPanel")?.remove();
    ncShowLogin();
  });
  if(acc.role==="owner"){
    ncBuildOwnerPanel();
    ncBuildDevMenu();
    ncUpdateOwnerNotifBadge();
    // Poll for new pending account requests every 4s
    setInterval(()=>{ncUpdateOwnerNotifBadge();},4000);
    document.getElementById("ncOwnerPanelBtn").addEventListener("click",()=>{
      ncRefreshOwnerPanel();
      document.getElementById("ncOwnerPanel").classList.toggle("open");
    });
    document.getElementById("ncDevMenuBtn").addEventListener("click",()=>{
      const dm=document.getElementById("ncDevMenu");
      if(dm)dm.classList.toggle("open");
    });
  }
  if(acc.role==="beta"){
    ncBuildSuggestPanel(acc);
    document.getElementById("ncSuggestBtn").addEventListener("click",()=>{
      document.getElementById("ncSuggestPanel").classList.toggle("open");
    });
  }
}

// ── Gate: check session or show login ──
let _ncServersInited=false;
function ncShowMenu(acc){
  window._ncCurrentAcc=acc;
  menu.style.display="block";
  setTimeout(()=>{
    ncInjectUserBadge(acc);
    ncApplyRoleRestrictions(acc);
    if(!_ncServersInited){_ncServersInited=true;ncInitServers();}
    const displayName=acc.displayName||acc.username;
    showToast(`👋 Hi, ${displayName}!`);
    // Global Chat — available to all roles
    ncBuildChatPanel();
    document.getElementById("ncChatBtn").addEventListener("click",()=>ncToggleChat());
    const initMsgs=ncChatLoad();
    _chatLastCount=initMsgs.length;
    ncChatStartPoll();
  },0);
}

// ── Boot: auto-login from saved session or show login screen ──
(function ncBoot(){
  const savedUser=ncGetSession();
  if(savedUser){
    const acc=ncFindByUsername(savedUser);
    if(acc){
      window._ncAutoLoginAcc=acc;
      return;
    }
  }
  window._ncRequireLogin=true;
})();

// ─── MENU HTML ────────────────────────────────────────────────────────────────
const menu=document.createElement("div");
menu.id="scriptMenu";
Object.assign(menu.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",maxHeight:"92vh",overflowY:"auto",zIndex:7777,borderRadius:"8px",padding:"16px 18px",display:"block",boxSizing:"border-box"});
menu.innerHTML=`
<div id="ncTitleBar">
  <span>⚙ Noob Controller</span>
  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
    <button id="ncCompactBtn" title="Toggle compact mode">⬛ Compact</button>
    <button class="nc-icon-btn" id="ncExportBtn" title="Export settings">⬇ Export</button>
    <button class="nc-icon-btn" id="ncImportBtn" title="Import settings">⬆ Import</button>
    <input type="file" id="ncImportFile" accept=".txt,.json" style="display:none">
    <button class="nc-icon-btn" id="ncThemeBtn" title="Themes">🎨</button>
    <button class="nc-icon-btn" id="ncModsBtn" title="Mods">🧩 Mods</button>
    <button class="nc-icon-btn" id="ncGuideBtn" title="Codespace Setup Guide">📡 Guide</button>
    <button class="nc-icon-btn" id="ncHelpBtn" title="How to / Commands">❓ Help</button>
    <button class="nc-icon-btn" id="ncMediaBtn" title="Media Player">🎵 Music</button>
    <button class="nc-icon-btn" id="ncLayoutBtn" title="Customize Layout">🔲 Layout</button>
    <button class="nc-icon-btn" id="ncAiBtn" title="AI Assistant">🤖 AI</button>
    <div class="nc-chat-btn-wrap"><button class="nc-icon-btn" id="ncChatBtn" title="Global Group Chat">💬 Chat</button><span id="ncChatUnread"></span></div>
    <div id="ncStatus">✕ Disconnected</div>
  </div>
</div>

<!-- ══ COMPACT VIEW ══ -->
<div id="ncCompactView">
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:13px;color:var(--dc-text-muted);font-weight:600;letter-spacing:.04em;">QUICK CONTROLS</span>
    <div id="ncCompactStatus">✕ Disconnected</div>
  </div>
  <hr class="nc-compact-divider">
  <div class="nc-compact-row">
    <span class="nc-compact-label">Server Hash</span>
    <input id="compactHash" placeholder="e.g. ca" style="flex:1;">
    <button id="ncCompactReconnect">↺ Reconnect All</button>
  </div>
  <div class="nc-compact-row">
    <span class="nc-compact-label">Tank</span>
    <select id="compactTankSelect" style="flex:1;"></select>
  </div>
  <div class="nc-compact-row" style="gap:8px;">
    <button id="ncCompactConnect">Connect 1</button>
    <input id="ncCompactCount" type="number" min="1" value="5">
    <button id="ncCompactSpawn">Spawn Multi</button>
    <button id="ncCompactKill">Kill All</button>
  </div>
</div>

<!-- ══ FULL VIEW ══ -->
<div id="ncFullView">

<!-- CODESPACE GUIDE PANEL -->
<div id="ncGuidePanel">
  <div class="nc-guide-section-header">📡 How to connect a GitHub Codespace</div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">1</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Create or open a GitHub Codespace</div>
      <div class="nc-guide-desc">Go to github.com → any repo → Code → Codespaces → New codespace. Wait for it to fully load.</div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">2</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Start your bot server on port 8082</div>
      <div class="nc-guide-desc">In the Codespace terminal, run your server. It must listen on port 8082.</div>
      <div class="nc-guide-code"><span>node server.js</span></div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">3</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Make port 8082 Public in the Ports tab</div>
      <div class="nc-guide-desc">Bottom bar → Ports tab → find 8082 → right-click → Port Visibility → Public.</div>
      <div class="nc-guide-warn">⚠ Private port = red dot + error 1006 in the script. Public is required.</div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">4</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Copy the forwarded URL from the Ports tab</div>
      <div class="nc-guide-desc">Hover over port 8082 → click the globe icon. The URL looks like:</div>
      <div class="nc-guide-code"><span>https://NAME-8082.preview.app.github.dev</span></div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">5</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Convert https:// → wss:// and paste below</div>
      <div class="nc-guide-desc">The script needs WSS, not HTTP. Paste your URL here — it converts automatically.</div>
      <div class="nc-guide-url-convert">
        <input id="ncGuideUrlInput" placeholder="Paste your https://... or wss://... URL here">
        <button class="nc-theme-btn-sm" id="ncGuideUrlCopy" style="background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;">Copy WSS</button>
        <button class="nc-theme-btn-sm" id="ncGuideUrlUse">+ Add Server</button>
      </div>
      <div class="nc-guide-url-result" id="ncGuideUrlResult"></div>
      <div class="nc-guide-note">💡 Clicking "Add Server" will create a new Codespace row and pre-fill it.</div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num">6</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Connect and spawn bots</div>
      <div class="nc-guide-desc">The server row connects automatically. Enter the game hash (from arras.io URL after #), pick a tank, then hit Connect 1 or Spawn Multi. Or use the CMD prompt:</div>
      <div class="nc-guide-code"><span>?spawn ca 50 tri-angle</span></div>
      <div class="nc-guide-note">💡 The hash is the part of the arras.io URL after the # symbol — e.g. arras.io/#ca → hash is "ca"</div>
    </div>
  </div>

  <div class="nc-guide-section-header" style="margin-top:12px!important;">🔧 Troubleshooting</div>

  <div class="nc-guide-step">
    <div class="nc-guide-num" style="background:var(--dc-red)!important;">!</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">🔴 Dot stays red / "Abnormal close (1006)"</div>
      <div class="nc-guide-desc">Port is Private. Go to Ports tab → right-click 8082 → Port Visibility → Public. Also make sure your URL uses wss://, not https://.</div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num" style="background:var(--dc-yellow)!important;color:#111!important;">!</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">🟡 Dot stays yellow / never goes green</div>
      <div class="nc-guide-desc">The Codespace URL changed — this happens every time you restart a Codespace. Grab the new URL from the Ports tab and update the server row.</div>
    </div>
  </div>

  <div class="nc-guide-step">
    <div class="nc-guide-num" style="background:var(--dc-bg-tertiary)!important;">?</div>
    <div class="nc-guide-body">
      <div class="nc-guide-title">Bots connect but won't spawn into the game</div>
      <div class="nc-guide-desc">Make sure the hash in the Server Hash field matches your current arras.io game room. Copy it fresh from the URL bar.</div>
    </div>
  </div>
</div>

<!-- HELP PANEL -->
<div id="ncHelpPanel">
  <div class="nc-help-section">
    <div class="nc-help-title">🖥 Command Prompt — type in the bar below the log</div>
    <div class="nc-help-row"><span class="nc-help-cmd">?spawn &lt;hash&gt; &lt;count&gt; [tank]</span><span class="nc-help-desc">Spawn bots into a game room</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?spawn ca 50 tri-angle</span><span class="nc-help-desc">Example — 50 Tri-Angles into hash "ca"</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?spawn abc123 10 drones</span><span class="nc-help-desc">Example — 10 Drones into hash "abc123"</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?kill</span><span class="nc-help-desc">Kill all bots immediately</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?tank &lt;name&gt;</span><span class="nc-help-desc">Switch all bots to a different tank</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?feed on / ?feed off</span><span class="nc-help-desc">Toggle bot feeding</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?mode rotate</span><span class="nc-help-desc">Bots orbit around you automatically</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?mode stayput</span><span class="nc-help-desc">Bots stop moving</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?mode growth</span><span class="nc-help-desc">Bots move toward your world position</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?mode normal</span><span class="nc-help-desc">Bots follow your mouse (default)</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?list tanks</span><span class="nc-help-desc">Print all tank name aliases in the log</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">?help</span><span class="nc-help-desc">Show this reference in the log</span></div>
  </div>
  <div class="nc-help-section">
    <div class="nc-help-title">🎮 Tank name aliases (use any in ?spawn / ?tank)</div>
    <div class="nc-help-aliases" id="ncHelpAliases"></div>
  </div>
  <div class="nc-help-section">
    <div class="nc-help-title">⌨ Keyboard shortcut</div>
    <div class="nc-help-row"><span class="nc-help-cmd">Escape</span><span class="nc-help-desc">Toggle show / hide the menu</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">↑ / ↓ in cmd bar</span><span class="nc-help-desc">Browse command history</span></div>
  </div>
  <div class="nc-help-section">
    <div class="nc-help-title">🧩 Mods panel (🧩 Mods button)</div>
    <div class="nc-help-row"><span class="nc-help-cmd">Repel / Charge / Jitter</span><span class="nc-help-desc">Built-in movement mods — click to toggle</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">Orbit / Spiral / Mirror</span><span class="nc-help-desc">More built-in movement patterns</span></div>
    <div class="nc-help-row"><span class="nc-help-cmd">Upload / Paste a Mod</span><span class="nc-help-desc">Load a custom .js mod via file or paste</span></div>
  </div>
</div>

<div id="ncThemePanel">
  <div class="nc-preset-strip" id="ncPresetStrip"></div>
  <div id="ncSwatchArea"></div>
  <span class="nc-section-label" style="margin-top:10px!important;">Font</span>
  <div class="nc-preset-strip" id="ncFontStrip"></div>
  <div class="nc-theme-save-row">
    <input id="ncThemeSaveName" placeholder="Save as…" type="text">
    <button class="nc-theme-btn-sm" id="ncThemeSaveBtn">Save</button>
  </div>
  <div class="nc-saved-theme-list" id="ncSavedThemeList"></div>
  <div class="nc-theme-img-row">
    <button class="nc-theme-btn-sm" id="ncThemeFromImgBtn" style="width:100%!important;">🖼 Generate Theme From Image</button>
    <input type="file" id="ncThemeImgFile" accept="image/*" style="display:none">
  </div>
  <div id="ncThemeImgPreview" style="display:none;margin-top:8px;border-radius:6px;overflow:hidden;max-height:120px;border:1px solid var(--dc-border-subtle);">
    <img id="ncThemeImgEl" style="width:100%;max-height:120px;object-fit:cover;display:block;">
  </div>
  <div id="ncThemeImgStatus" style="display:none;font-size:12px;color:var(--dc-text-muted);margin-top:5px;font-family:'Inter',sans-serif;"></div>
  <div id="ncThemeImgSaveRow" class="nc-theme-img-save-row" style="display:none;">
    <input id="ncThemeImgSaveName" class="nc-theme-save-row" placeholder="Name this preset…" type="text" style="flex:1;background:var(--dc-bg-tertiary);border:1px solid var(--dc-border-subtle);border-radius:4px;color:var(--dc-text-normal);padding:5px 10px;font-family:'Inter',sans-serif;font-size:13px;outline:none;min-width:0;">
    <button class="nc-theme-btn-sm" id="ncThemeImgSaveBtn">💾 Save Preset</button>
  </div>
</div>
<div id="ncModsPanel">
  <span class="nc-section-label">Built-in Mods — click to toggle (one active at a time)</span>
  <div class="nc-mod-grid" id="ncBuiltinModGrid"></div>
  <span class="nc-section-label" style="margin-top:10px!important;">Custom Mods</span>
  <div class="nc-mod-grid" id="ncCustomModGrid"></div>
  <div class="nc-mod-editor-area">
    <span class="nc-section-label" style="margin-top:10px!important;">Upload / Paste a Mod</span>
    <textarea id="ncModEditor" spellcheck="false" placeholder="registerMod({\n  name: 'My Mod',\n  icon: '🎯',\n  description: 'What it does',\n  tick: (ctx) => ({\n    bx: ctx.mouseX * 2,\n    by: ctx.mouseY * 2\n  })\n});"></textarea>
    <div class="nc-mod-load-row">
      <button class="nc-theme-btn-sm" id="ncModLoadBtn">▶ Load Mod</button>
      <button class="nc-theme-btn-sm" id="ncModFileBtn" style="background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;">📂 From File</button>
      <input type="file" id="ncModFile" accept=".js,.user.js,.txt" style="display:none">
      <button class="nc-theme-btn-sm" id="ncModClearCustomBtn" style="background:transparent!important;color:var(--dc-red)!important;border:1px solid var(--dc-red)!important;">Clear Custom</button>
      <span class="nc-mod-status" id="ncModStatus"></span>
    </div>
  </div>
  <details class="nc-mod-api-ref">
    <summary>📖 Mod API Reference</summary>
    <pre>// Works with plain JS OR a full .user.js file —
// the ==UserScript== header is stripped automatically.

// registerMod() is available globally.
// tick() runs every 80ms broadcast tick.
// Return { bx, by } to override movement.
// Active mod takes priority over all other
// movement modes (stay put, auto-rotate, etc).

registerMod({
  name: 'Rush',      // display name
  icon: '💨',        // emoji shown on button
  description: '...', // tooltip text
  tick: (ctx) => {
    // ctx fields:
    //   x, y        — player world coords
    //   mouseX, mouseY — mouse offset from center
    //   mouseDown   — left click held
    //   rMouseDown  — right click held
    //   keys        — { ShiftLeft, ... }
    return { bx: ctx.mouseX * 3, by: ctx.mouseY * 3 };
  }
});</pre>
  </details>
</div>

<!-- MEDIA PLAYER PANEL -->
<div id="ncMediaPanel">
  <div class="nc-media-title">🎵 Media Player</div>
  <div class="nc-media-presets" id="ncMediaPresets">
    <span class="nc-media-preset-pill" data-url="https://www.youtube.com/watch?v=jfKfPfyJRdk">lofi hip hop 📻</span>
    <span class="nc-media-preset-pill" data-url="https://www.youtube.com/watch?v=5qap5aO4i9A">lofi chill 🌙</span>
    <span class="nc-media-preset-pill" data-url="https://www.youtube.com/watch?v=DWcJFNfaw9c">phonk 🔥</span>
    <span class="nc-media-preset-pill" data-url="https://www.youtube.com/watch?v=4xDzrJKXOOY">synthwave 🌆</span>
  </div>
  <div class="nc-media-url-row">
    <input id="ncMediaUrl" placeholder="YouTube URL or direct audio/video URL…" type="text">
    <button class="nc-media-load-btn" id="ncMediaLoadBtn">▶ Load</button>
    <button class="nc-media-load-btn" id="ncMediaFileBtn" title="Upload local file">📁 File</button>
    <input type="file" id="ncMediaFileInput" accept="audio/*,video/*" style="display:none">
  </div>
  <video id="ncMediaPlayer" controls style="width:100%;border-radius:6px;margin-bottom:10px;"></video>
  <audio id="ncMediaAudio" controls style="width:100%;margin-bottom:10px;"></audio>
  <div class="nc-media-controls">
    <button class="nc-media-ctrl-btn" id="ncMediaPlayPause" title="Play / Pause">⏯</button>
    <button class="nc-media-ctrl-btn" id="ncMediaStop" title="Stop">⏹</button>
    <input type="range" id="ncMediaSeek" min="0" max="100" value="0" step="0.1" title="Seek">
    <span id="ncMediaTime">0:00 / 0:00</span>
    <span style="font-size:12px;color:var(--dc-text-muted);font-family:'Inter',sans-serif;">🔊</span>
    <input type="range" id="ncMediaVolume" min="0" max="1" step="0.02" value="0.8" title="Volume">
  </div>
  <div class="nc-media-status" id="ncMediaStatus">Paste a URL or pick a preset above.</div>
</div>

<!-- LAYOUT EDITOR PANEL -->
<div id="ncLayoutPanel">
  <div class="nc-layout-title">🔲 Menu Layout</div>
  <div class="nc-layout-desc">Drag sections to reorder · toggle to show/hide · adjust width &amp; opacity</div>
  <div class="nc-layout-width-row">
    <label>Menu Width</label>
    <input type="range" id="ncLayoutWidthSlider" min="380" max="900" step="10" value="600">
    <span id="ncLayoutWidthVal">600px</span>
  </div>
  <div class="nc-layout-opacity-row">
    <label>Opacity</label>
    <input type="range" id="ncLayoutOpacitySlider" min="20" max="100" step="1" value="100">
    <span id="ncLayoutOpacityVal">100%</span>
  </div>
  <div id="ncLayoutList"></div>
  <div class="nc-layout-btn-row">
    <button class="nc-layout-action-btn primary" id="ncLayoutSaveBtn">💾 Save Layout</button>
    <button class="nc-layout-action-btn danger" id="ncLayoutResetBtn">↺ Reset Default</button>
  </div>
</div>

<!-- AI ASSISTANT PANEL -->
<div id="ncAiPanel">
  <div class="nc-ai-title">🤖 AI Assistant</div>
  <div id="ncAiLog"></div>
  <div id="ncAiThinking" style="display:none;">⏳ Thinking…</div>
  <div id="ncAiChips">
    <button class="nc-ai-chip" data-q="What commands can I use in the command prompt?">Commands</button>
    <button class="nc-ai-chip" data-q="How do I set up a Codespace server?">Codespace</button>
    <button class="nc-ai-chip" data-q="How do I write a custom mod?">Custom mods</button>
    <button class="nc-ai-chip" data-q="What movement modes are available?">Modes</button>
    <button class="nc-ai-chip" data-q="What are the built-in mods and what do they do?">Built-in mods</button>
    <button class="nc-ai-chip" data-q="How do I spawn multiple bots at once?">Spawn bots</button>
  </div>
  <div id="ncAiInputRow">
    <input id="ncAiInput" placeholder="Ask anything about Noob Controller…" autocomplete="off" spellcheck="false">
    <button id="ncAiSendBtn">Send</button>
  </div>
</div>

<!-- COMMAND PROMPT PANEL -->
<div id="ncCmdPanel">
  <div id="ncCmdLog"></div>
  <div id="ncCmdInputRow">
    <span id="ncCmdPromptLabel">NC &gt;</span>
    <input id="ncCmdInput" placeholder="?spawn hash count tank  |  ?help for all commands" autocomplete="off" spellcheck="false">
    <button id="ncCmdRunBtn">Run</button>
  </div>
</div>

<p style="border-bottom:none!important;padding-bottom:2px!important;align-items:center!important;">
  <b>Servers</b>
  <button id="ncCollapseBtn" title="Collapse/Expand servers">▲</button>
  <span style="flex:1"></span>
  <span id="serverBtnGroup" style="display:flex;gap:5px;align-items:center;">
    <button id="addLocal">+ Local</button>
    <button id="addSpace">+ Codespace</button>
    <button id="reconnectAll">↺ Reconnect All</button>
  </span>
</p>
<div id="serversCollapsible">
  <div id="serverList" style="margin:4px 0 8px;display:flex;flex-direction:column;gap:6px;"></div>
</div>
<hr>
<p>
  <span>Tank</span>
  <select id="tankSelect" style="flex:1"></select>
  <button class="nc-icon-btn" id="ncTanksBtn" title="Edit tanks" style="font-size:14px;padding:4px 9px;">✏️</button>
</p>
<div id="ncTanksPanel">
  <div class="te-toolbar">
    <select id="teProjSelect">
      <option value="full">Full const</option>
      <option value="keys">Keys only</option>
      <option value="names">Names only</option>
      <option value="groups">Groups with tanks[]</option>
    </select>
    <button class="nc-theme-btn-sm" id="teApplyBtn">Apply</button>
    <button class="nc-theme-btn-sm" id="teCopyBtn" style="background:var(--dc-bg-tertiary)!important;color:var(--dc-text-muted)!important;">Copy</button>
    <button class="nc-theme-btn-sm" id="teResetBtn" style="background:transparent!important;color:var(--dc-red)!important;border:1px solid var(--dc-red)!important;">Reset</button>
  </div>
  <textarea id="teTankEditor" spellcheck="false"></textarea>
  <div class="te-btn-row">
    <span class="te-status" id="teStatus">Editing full const — Apply to update the tank selector.</span>
  </div>
</div>
<p><span>Server Hash</span><input id="serverHash" style="flex:1"></p>
<p><span>Follow mouse</span><input id="mbs" type="checkbox" checked></p>
<p><span>Feed</span><input id="feeding" type="checkbox"></p>
<hr>
<p style="gap:8px!important;border-bottom:none!important;">
  <button id="connectNoob">Connect 1</button>
  <input id="botCount" type="number" min="1" value="5">
  <button id="spawnMulti">Spawn Multi</button>
</p>
<p style="border-bottom:none!important;margin-top:6px!important;flex-direction:column!important;gap:5px!important;">
  <button id="autoRotateBtn">↻ Auto Rotate: OFF</button>
  <div id="autoRotateTimer">–</div>
</p>
<p style="border-bottom:none!important;margin-top:6px!important;">
  <button id="stayPutBtn">📍 Stay Put: OFF</button>
</p>
<p style="border-bottom:none!important;margin-top:6px!important;">
  <button id="growthModeBtn">🌱 Growth Mode: OFF</button>
</p>
<p style="border-bottom:none!important;margin-top:6px!important;flex-direction:column!important;gap:4px!important;">
  <div id="botChatRow">
    <input id="botChatInput" placeholder="Bot chat message…" maxlength="120" autocomplete="off" spellcheck="false">
    <button id="botChatSend">💬 Say</button>
  </div>
</p>
<p style="border-bottom:none!important;margin-top:6px!important;">
  <button id="deleteNoobs">Kill All Bots</button>
</p>

</div><!-- end #ncFullView -->
`;
document.body.appendChild(menu);

// ── Account boot: hide menu and show login, or restore session ──
if(window._ncRequireLogin){
  menu.style.display="none";
  ncShowLogin();
} else if(window._ncAutoLoginAcc){
  window._ncCurrentAcc=window._ncAutoLoginAcc;
  ncInjectUserBadge(window._ncAutoLoginAcc);
  ncApplyRoleRestrictions(window._ncAutoLoginAcc);
  // Wire chat for auto-login
  setTimeout(()=>{
    ncBuildChatPanel();
    const chatBtnAuto=document.getElementById("ncChatBtn");
    if(chatBtnAuto)chatBtnAuto.addEventListener("click",()=>ncToggleChat());
    const initMsgsAuto=ncChatLoad();
    _chatLastCount=initMsgsAuto.length;
    ncChatStartPoll();
  },0);
}

const $=id=>document.getElementById(id);
const HTML={
  addLocal:$("addLocal"),addSpace:$("addSpace"),reconnectAll:$("reconnectAll"),
  serverList:$("serverList"),serversCollapsible:$("serversCollapsible"),
  ncCollapseBtn:$("ncCollapseBtn"),serverBtnGroup:$("serverBtnGroup"),
  tankSelect:$("tankSelect"),serverHash:$("serverHash"),
  mbs:$("mbs"),feeding:$("feeding"),
  connectNoob:$("connectNoob"),botCount:$("botCount"),spawnMulti:$("spawnMulti"),
  deleteNoobs:$("deleteNoobs"),ncStatus:$("ncStatus"),
  autoRotateBtn:$("autoRotateBtn"),autoRotateTimer:$("autoRotateTimer"),
  stayPutBtn:$("stayPutBtn"),growthModeBtn:$("growthModeBtn"),
  ncThemeBtn:$("ncThemeBtn"),ncThemePanel:$("ncThemePanel"),
  ncPresetStrip:$("ncPresetStrip"),ncSwatchArea:$("ncSwatchArea"),
  ncThemeSaveName:$("ncThemeSaveName"),ncThemeSaveBtn:$("ncThemeSaveBtn"),
  ncSavedThemeList:$("ncSavedThemeList"),
  ncExportBtn:$("ncExportBtn"),ncImportBtn:$("ncImportBtn"),ncImportFile:$("ncImportFile"),
  ncTanksBtn:$("ncTanksBtn"),ncTanksPanel:$("ncTanksPanel"),
  teProjSelect:$("teProjSelect"),teTankEditor:$("teTankEditor"),
  teApplyBtn:$("teApplyBtn"),teCopyBtn:$("teCopyBtn"),teResetBtn:$("teResetBtn"),teStatus:$("teStatus"),
  ncModsBtn:$("ncModsBtn"),ncModsPanel:$("ncModsPanel"),
  ncBuiltinModGrid:$("ncBuiltinModGrid"),ncCustomModGrid:$("ncCustomModGrid"),
  ncModEditor:$("ncModEditor"),ncModLoadBtn:$("ncModLoadBtn"),
  ncModFileBtn:$("ncModFileBtn"),ncModFile:$("ncModFile"),
  ncModClearCustomBtn:$("ncModClearCustomBtn"),ncModStatus:$("ncModStatus"),
  ncHelpBtn:$("ncHelpBtn"),ncHelpPanel:$("ncHelpPanel"),ncHelpAliases:$("ncHelpAliases"),
  ncCmdPanel:$("ncCmdPanel"),ncCmdLog:$("ncCmdLog"),
  ncCmdInput:$("ncCmdInput"),ncCmdRunBtn:$("ncCmdRunBtn"),
  ncGuideBtn:$("ncGuideBtn"),ncGuidePanel:$("ncGuidePanel"),
  ncGuideUrlInput:$("ncGuideUrlInput"),ncGuideUrlResult:$("ncGuideUrlResult"),
  ncGuideUrlCopy:$("ncGuideUrlCopy"),ncGuideUrlUse:$("ncGuideUrlUse"),
  ncAiBtn:$("ncAiBtn"),ncAiPanel:$("ncAiPanel"),
  ncAiLog:$("ncAiLog"),ncAiInput:$("ncAiInput"),ncAiSendBtn:$("ncAiSendBtn"),
  ncAiThinking:$("ncAiThinking"),ncAiChips:$("ncAiChips"),
  ncLayoutBtn:$("ncLayoutBtn"),ncLayoutPanel:$("ncLayoutPanel"),
  ncLayoutList:$("ncLayoutList"),ncLayoutWidthSlider:$("ncLayoutWidthSlider"),
  ncLayoutWidthVal:$("ncLayoutWidthVal"),ncLayoutOpacitySlider:$("ncLayoutOpacitySlider"),
  ncLayoutOpacityVal:$("ncLayoutOpacityVal"),ncLayoutSaveBtn:$("ncLayoutSaveBtn"),
  ncLayoutResetBtn:$("ncLayoutResetBtn"),
  ncMediaBtn:$("ncMediaBtn"),ncMediaPanel:$("ncMediaPanel"),
  ncMediaUrl:$("ncMediaUrl"),ncMediaLoadBtn:$("ncMediaLoadBtn"),
  ncMediaPlayer:$("ncMediaPlayer"),ncMediaAudio:$("ncMediaAudio"),
  ncMediaPlayPause:$("ncMediaPlayPause"),ncMediaStop:$("ncMediaStop"),
  ncMediaSeek:$("ncMediaSeek"),ncMediaVolume:$("ncMediaVolume"),
  ncMediaTime:$("ncMediaTime"),ncMediaStatus:$("ncMediaStatus"),
  ncMediaPresets:$("ncMediaPresets"),
  // compact
  ncCompactBtn:$("ncCompactBtn"),
  ncCompactView:$("ncCompactView"),ncFullView:$("ncFullView"),
  ncCompactStatus:$("ncCompactStatus"),
  compactHash:$("compactHash"),compactTankSelect:$("compactTankSelect"),
  ncCompactReconnect:$("ncCompactReconnect"),
  ncCompactConnect:$("ncCompactConnect"),ncCompactSpawn:$("ncCompactSpawn"),
  ncCompactKill:$("ncCompactKill"),ncCompactCount:$("ncCompactCount"),
};

// ─── COMPACT MODE ─────────────────────────────────────────────────────────────
let compactMode=false;
function syncCompactSelects(){
  // keep compact tank select in sync with main
  const prev=HTML.compactTankSelect.value;
  HTML.compactTankSelect.innerHTML=HTML.tankSelect.innerHTML;
  if(tanks[prev])HTML.compactTankSelect.value=prev;
  else HTML.compactTankSelect.value=HTML.tankSelect.value;
  // keep compact hash in sync with main
  if(HTML.compactHash.value==="")HTML.compactHash.value=HTML.serverHash.value;
}
function syncCompactStatus(){
  const any=servers.some(s=>s.ws&&s.ws.readyState===WebSocket.OPEN);
  const el=HTML.ncCompactStatus;
  if(any){el.textContent="● Connected";el.className="connected";}
  else{el.textContent="✕ Disconnected";el.className="";}
}
HTML.ncCompactBtn.addEventListener("click",()=>{
  compactMode=!compactMode;
  HTML.ncCompactBtn.classList.toggle("active",compactMode);
  HTML.ncCompactBtn.textContent=compactMode?"⬛ Full View":"⬛ Compact";
  HTML.ncCompactView.classList.toggle("active",compactMode);
  HTML.ncFullView.classList.toggle("hidden",compactMode);
  menu.style.width=compactMode?"380px":"600px";
  if(compactMode)syncCompactSelects();
});
// Compact hash syncs back to main when changed
HTML.compactHash.addEventListener("input",()=>{HTML.serverHash.value=HTML.compactHash.value;});
HTML.serverHash.addEventListener("input",()=>{HTML.compactHash.value=HTML.serverHash.value;});
// Compact tank select syncs to main
HTML.compactTankSelect.addEventListener("change",()=>{
  HTML.tankSelect.value=HTML.compactTankSelect.value;
  const val=HTML.compactTankSelect.value;
  packet("Z",tanks[val]?.tanks||val);
});
// Compact buttons
HTML.ncCompactReconnect.addEventListener("click",()=>HTML.reconnectAll.click());
HTML.ncCompactConnect.addEventListener("click",()=>{
  const hash=(HTML.compactHash.value||HTML.serverHash.value).replace("#","")||location.hash.slice(1);
  HTML.serverHash.value=hash;
  if(ncIsFreePlan()){
    ncShowUpgradePopup(()=>packet("F",hash));
  } else {
    packet("F",hash);
  }
});
HTML.ncCompactSpawn.addEventListener("click",()=>{
  const hash=(HTML.compactHash.value||HTML.serverHash.value).replace("#","")||location.hash.slice(1);
  HTML.serverHash.value=hash;
  const count=Math.max(1,parseInt(HTML.ncCompactCount.value)||1);
  if(ncIsFreePlan()){
    ncShowUpgradePopup(()=>{for(let i=0;i<count;i++)setTimeout(()=>packet("F",hash),i*150);});
  } else {
    for(let i=0;i<count;i++)setTimeout(()=>packet("F",hash),i*150);
  }
});
HTML.ncCompactKill.addEventListener("click",()=>packet("B"));

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────
function exportPreset(){
  const payload={_nc_version:EXPORT_VERSION,_exported_at:new Date().toISOString(),activeTheme:{...currentTheme},activeFont:_currentFont,userThemes:getUserThemes(),servers:getSaved()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"text/plain;charset=utf-8"});
  const ts=new Date().toISOString().slice(0,16).replace(/[:T]/g,"-");
  const name=`noob-controller-preset-${ts}.txt`;
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);
  showToast(`✅ Exported as ${name}`);
}
function importPreset(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=evt=>{
    let data;try{data=JSON.parse(evt.target.result);}catch{showToast("❌ Invalid file — couldn't parse JSON",true);return;}
    if(!data._nc_version){showToast("❌ Not a Noob Controller preset file",true);return;}
    let changed=0;
    if(data.activeTheme&&typeof data.activeTheme==="object"){
      THEME_TOKENS.forEach(t=>{if(data.activeTheme[t.key])currentTheme[t.key]=data.activeTheme[t.key];});
      applyTheme(currentTheme);persistTheme(currentTheme);syncSwatches();
      document.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));changed++;
    }
    if(data.userThemes&&typeof data.userThemes==="object"){putUserThemes({...getUserThemes(),...data.userThemes});renderSavedThemeList();changed++;}
    if(Array.isArray(data.servers)&&data.servers.length>0){
      for(const s of data.servers){const url=typeof s==="string"?s:s.url;const label=typeof s==="object"?(s.label||""):"";if(!url)continue;upsertSaved(url,label);if(!servers.some(srv=>srv.urlInput?.value?.trim()===url))addServer("codespace",url,label);}
      changed++;
    }
    if(data.activeFont&&FONT_OPTIONS.some(f=>f.key===data.activeFont)){persistFont(data.activeFont);applyFont(data.activeFont);const fs=document.getElementById("ncFontStrip");if(fs){fs.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));const fp=fs.querySelector(`[data-font="${data.activeFont}"]`);if(fp)fp.classList.add("active");}changed++;}
    if(changed===0){showToast("⚠️ Nothing recognised to import",true);return;}
    showToast(`✅ Preset imported${data._exported_at?` (exported ${data._exported_at.slice(0,10)})`:"" }`);
  };
  reader.onerror=()=>showToast("❌ Failed to read file",true);
  reader.readAsText(file);
}
HTML.ncExportBtn.addEventListener("click",exportPreset);
HTML.ncImportBtn.addEventListener("click",()=>HTML.ncImportFile.click());
HTML.ncImportFile.addEventListener("change",e=>{importPreset(e.target.files[0]);HTML.ncImportFile.value="";});

// ─── THEME EDITOR ─────────────────────────────────────────────────────────────
let themeOpen=false,currentTheme={};
const swatchColorEls={};
THEME_TOKENS.forEach(t=>{currentTheme[t.key]=_initialTheme[t.key]||t.def;});
HTML.ncThemeBtn.addEventListener("click",()=>{themeOpen=!themeOpen;HTML.ncThemePanel.classList.toggle("open",themeOpen);HTML.ncThemeBtn.style.color=themeOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";});
function buildPresets(){
  HTML.ncPresetStrip.innerHTML="";
  Object.keys(THEME_PRESETS).forEach(name=>{
    const pill=document.createElement("button");pill.className="nc-preset-pill";pill.textContent=name;
    pill.addEventListener("click",()=>{
      const vals=THEME_PRESETS[name];
      THEME_TOKENS.forEach(t=>{currentTheme[t.key]=vals[t.key]||t.def;});
      syncSwatches();applyTheme(currentTheme);persistTheme(currentTheme);
      document.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));pill.classList.add("active");
    });
    HTML.ncPresetStrip.appendChild(pill);
  });
  HTML.ncPresetStrip.children[0]?.classList.add("active");
  // ── Font pills ──
  const fontStrip=document.getElementById("ncFontStrip");
  if(fontStrip){
    fontStrip.innerHTML="";
    FONT_OPTIONS.forEach(opt=>{
      const pill=document.createElement("button");
      pill.className="nc-preset-pill";
      pill.dataset.font=opt.key;
      pill.textContent=opt.label;
      pill.style.fontFamily=opt.family;
      if(opt.key===_currentFont)pill.classList.add("active");
      pill.addEventListener("click",()=>{
        persistFont(opt.key);
        applyFont(opt.key);
        fontStrip.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));
        pill.classList.add("active");
      });
      fontStrip.appendChild(pill);
    });
  }
}
function buildSwatches(){
  const groups={};
  THEME_TOKENS.forEach(t=>{if(!groups[t.g])groups[t.g]=[];groups[t.g].push(t);});
  HTML.ncSwatchArea.innerHTML="";
  Object.entries(groups).forEach(([gName,tokens])=>{
    const lbl=document.createElement("span");lbl.className="nc-section-label";lbl.textContent=gName;HTML.ncSwatchArea.appendChild(lbl);
    const grid=document.createElement("div");grid.className="nc-swatch-grid";
    tokens.forEach(t=>{
      const sw=document.createElement("div");sw.className="nc-swatch";
      const circle=document.createElement("div");circle.className="nc-swatch-circle";circle.style.background=currentTheme[t.key]||t.def;circle.title=t.label;
      const colorInp=document.createElement("input");colorInp.type="color";colorInp.value=currentTheme[t.key]||t.def;
      colorInp.addEventListener("input",()=>{currentTheme[t.key]=colorInp.value;circle.style.background=colorInp.value;applyTheme(currentTheme);persistTheme(currentTheme);document.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));});
      swatchColorEls[t.key]={circle,colorInp};
      const nm=document.createElement("div");nm.className="nc-swatch-name";nm.textContent=t.label;
      circle.appendChild(colorInp);sw.append(circle,nm);grid.appendChild(sw);
    });
    HTML.ncSwatchArea.appendChild(grid);
  });
}
function syncSwatches(){THEME_TOKENS.forEach(t=>{const els=swatchColorEls[t.key];if(!els)return;const val=currentTheme[t.key]||t.def;els.circle.style.background=val;els.colorInp.value=val;});}
const getUserThemes=()=>{try{return JSON.parse(localStorage.getItem(USER_THEMES_KEY))||{};}catch{return{};}};
const putUserThemes=d=>localStorage.setItem(USER_THEMES_KEY,JSON.stringify(d));
function renderSavedThemeList(){
  HTML.ncSavedThemeList.innerHTML="";
  const saved=getUserThemes();
  Object.keys(saved).forEach(name=>{
    const item=document.createElement("div");item.className="nc-saved-theme-item";
    const nm=document.createElement("span");nm.textContent=name;
    const loadBtn=document.createElement("button");loadBtn.className="nc-theme-btn-sm";loadBtn.style.cssText="font-size:11px;padding:2px 7px;background:var(--dc-bg-floating)!important;color:var(--dc-text-muted)!important;";loadBtn.textContent="Load";
    loadBtn.addEventListener("click",e=>{e.stopPropagation();const vals=getUserThemes()[name];if(!vals)return;THEME_TOKENS.forEach(t=>{currentTheme[t.key]=vals[t.key]||t.def;});syncSwatches();applyTheme(currentTheme);persistTheme(currentTheme);document.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));});
    const delBtn=document.createElement("button");delBtn.className="nc-saved-theme-del";delBtn.textContent="✕";
    delBtn.addEventListener("click",e=>{e.stopPropagation();const d=getUserThemes();delete d[name];putUserThemes(d);renderSavedThemeList();});
    if(saved[name]&&saved[name]._img){const thumb=document.createElement("img");thumb.className="nc-saved-theme-thumb";thumb.src=saved[name]._img;thumb.title=name;item.appendChild(thumb);}
    item.append(nm,loadBtn,delBtn);HTML.ncSavedThemeList.appendChild(item);
  });
}
HTML.ncThemeSaveBtn.addEventListener("click",()=>{const name=HTML.ncThemeSaveName.value.trim();if(!name)return;const d=getUserThemes();d[name]={...currentTheme};putUserThemes(d);renderSavedThemeList();HTML.ncThemeSaveName.value="";});
buildPresets();buildSwatches();renderSavedThemeList();
applyFont(_currentFont);

// ─── IMAGE → THEME ────────────────────────────────────────────────────────────
(function(){
  const imgBtn=document.getElementById("ncThemeFromImgBtn");
  const imgFile=document.getElementById("ncThemeImgFile");
  const imgPreview=document.getElementById("ncThemeImgPreview");
  const imgEl=document.getElementById("ncThemeImgEl");
  const imgStatus=document.getElementById("ncThemeImgStatus");
  const imgSaveRow=document.getElementById("ncThemeImgSaveRow");
  const imgSaveName=document.getElementById("ncThemeImgSaveName");
  const imgSaveBtn=document.getElementById("ncThemeImgSaveBtn");
  if(!imgBtn||!imgFile)return;
  let _lastThumbDataUrl=null;
  imgBtn.addEventListener("click",()=>imgFile.click());
  imgFile.addEventListener("change",e=>{
    const file=e.target.files[0];imgFile.value="";
    if(!file||!file.type.startsWith("image/"))return;
    imgSaveRow.style.display="none";imgSaveName.value="";_lastThumbDataUrl=null;
    const url=URL.createObjectURL(file);
    imgEl.src=url;imgPreview.style.display="block";
    imgStatus.style.display="block";imgStatus.style.color="var(--dc-text-muted)";imgStatus.textContent="⏳ Sampling colours…";
    const img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      // draw onto a small canvas to sample pixels
      const SIZE=64;
      const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;
      const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,SIZE,SIZE);
      const data=ctx.getImageData(0,0,SIZE,SIZE).data;
      // store thumbnail as data URL (64×64)
      _lastThumbDataUrl=canvas.toDataURL("image/jpeg",0.7);
      // collect RGB buckets (16-level quantisation)
      const buckets={};
      for(let i=0;i<data.length;i+=4){
        const r=data[i]>>4,g=data[i+1]>>4,b=data[i+2]>>4,a=data[i+3];
        if(a<128)continue;
        const k=`${r},${g},${b}`;buckets[k]=(buckets[k]||{r:0,g:0,b:0,n:0});
        buckets[k].r+=data[i];buckets[k].g+=data[i+1];buckets[k].b+=data[i+2];buckets[k].n++;
      }
      // sort buckets by frequency
      const sorted=Object.values(buckets).sort((a,b)=>b.n-a.n);
      // pick diverse palette by ensuring enough hue distance
      function toHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0,s=0,l=(mx+mn)/2;if(d){s=d/(1-Math.abs(2*l-1));if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=h/6*360;if(h<0)h+=360;}return{h,s,l};}
      function toHex(r,g,b){return"#"+[r,g,b].map(x=>Math.round(x).toString(16).padStart(2,"0")).join("");}
      function darken(r,g,b,amt){return[Math.max(0,r-amt),Math.max(0,g-amt),Math.max(0,b-amt)];}
      function lighten(r,g,b,amt){return[Math.min(255,r+amt),Math.min(255,g+amt),Math.min(255,b+amt)];}
      function luminance(r,g,b){return 0.299*r+0.587*g+0.114*b;}
      // pick top colour (most frequent), skip near-grey for accent
      const palette=[];
      for(const bk of sorted){
        const avg={r:bk.r/bk.n,g:bk.g/bk.n,b:bk.b/bk.n};
        const hsl=toHsl(avg.r,avg.g,avg.b);
        // check diversity from already picked
        const far=palette.every(p=>{const dh=Math.abs(p.h-hsl.h);return Math.min(dh,360-dh)>25||Math.abs(p.l-hsl.l)>0.15;});
        if(far){palette.push({...hsl,...avg});}
        if(palette.length>=6)break;
      }
      // choose dominant (most frequent diverse colour) and accent (most saturated)
      const dom=palette[0]||{r:49,g:51,b:56};
      const accent=palette.slice(1).reduce((best,c)=>c.s>best.s?c:best,palette[1]||dom);
      // derive dark variant of dominant for backgrounds
      const lum=luminance(dom.r,dom.g,dom.b);
      // if image is light, flip to dark base
      const base=lum>160?darken(dom.r,dom.g,dom.b,100):[dom.r,dom.g,dom.b];
      const [br,bg,bb]=base;
      const bg1=toHex(...darken(br,bg,bb,10));   // bg-secondary (slightly darker)
      const bg2=toHex(...darken(br,bg,bb,20));   // bg-tertiary
      const bg3=toHex(...darken(br,bg,bb,30));   // bg-floating
      const bgPrimary=toHex(br,bg,bb);
      const [ar,ag,ab]=[accent.r,accent.g,accent.b];
      const accentMain=toHex(ar,ag,ab);
      const accentDark=toHex(...darken(ar,ag,ab,30));
      const accentLight=toHex(...lighten(ar,ag,ab,30));
      // text: desaturated light version of accent
      const textNorm=toHex(...lighten(br,bg,bb,160));
      const textMuted=toHex(...lighten(br,bg,bb,90));
      const borderMain=bg2;
      const borderSubtle=toHex(...lighten(br,bg,bb,40));
      const newTheme={
        "--dc-bg-primary":bgPrimary,"--dc-bg-secondary":bg1,"--dc-bg-tertiary":bg2,"--dc-bg-floating":bg3,
        "--dc-blurple":accentMain,"--dc-blurple-dark":accentDark,"--dc-blurple-light":accentLight,
        "--dc-green":"#23a55a","--dc-red":"#f23f43","--dc-yellow":"#f0b132",
        "--dc-text-normal":textNorm,"--dc-text-muted":textMuted,"--dc-text-link":accentLight,
        "--dc-border":borderMain,"--dc-border-subtle":borderSubtle,"--dc-interactive":textMuted,
      };
      THEME_TOKENS.forEach(t=>{currentTheme[t.key]=newTheme[t.key]||t.def;});
      syncSwatches();applyTheme(currentTheme);persistTheme(currentTheme);
      document.querySelectorAll(".nc-preset-pill").forEach(p=>p.classList.remove("active"));
      imgStatus.style.color="var(--dc-green)";imgStatus.textContent="✅ Theme applied from image!";
      // show save-as-preset row
      imgSaveName.value=file.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim()||"Image Theme";
      imgSaveRow.style.display="flex";
    };
    img.onerror=()=>{imgStatus.style.color="var(--dc-red)";imgStatus.textContent="❌ Failed to load image.";};
    img.src=url;
  });
  // save-as-preset button
  imgSaveBtn.addEventListener("click",()=>{
    const name=(imgSaveName.value||"").trim();
    if(!name){imgSaveName.focus();return;}
    const d=getUserThemes();
    d[name]={...currentTheme};
    if(_lastThumbDataUrl)d[name]._img=_lastThumbDataUrl;
    putUserThemes(d);renderSavedThemeList();
    imgSaveName.value="";imgSaveRow.style.display="none";
    showToast(`✅ Saved preset "${name}"`);
  });
})();

// ─── COLLAPSIBLE SERVERS ──────────────────────────────────────────────────────
let serversCollapsed=false;
HTML.ncCollapseBtn.addEventListener("click",()=>{serversCollapsed=!serversCollapsed;HTML.serversCollapsible.classList.toggle("collapsed",serversCollapsed);HTML.serverBtnGroup.style.display=serversCollapsed?"none":"flex";HTML.ncCollapseBtn.textContent=serversCollapsed?"▼":"▲";HTML.ncCollapseBtn.title=serversCollapsed?"Expand servers":"Collapse servers";});

// ─── SAVED SERVER STORAGE ─────────────────────────────────────────────────────
const getSaved=()=>{try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY));if(!Array.isArray(raw))return[];return raw.map(s=>typeof s==="string"?{url:s,label:""}:s);}catch{return[];}};
function upsertSaved(url,label=""){if(!url)return;const list=getSaved();const idx=list.findIndex(s=>s.url===url);if(idx>=0)list[idx]={url,label};else list.push({url,label});localStorage.setItem(SAVE_KEY,JSON.stringify(list));}
const removeSaved=url=>{if(!url)return;localStorage.setItem(SAVE_KEY,JSON.stringify(getSaved().filter(s=>s.url!==url)));};

// ─── MULTI-SERVER STATE ───────────────────────────────────────────────────────
let servers=[],nextId=0;
function updateGlobalStatus(){
  const any=servers.some(s=>s.ws&&s.ws.readyState===WebSocket.OPEN);
  const el=HTML.ncStatus;
  if(any){el.textContent="● Connected";el.className="connected";}
  else{el.textContent="✕ Disconnected";el.className="";}
  syncCompactStatus();
}

// ─── URL NORMALISER (https → wss) ────────────────────────────────────────────
function normaliseWsUrl(raw){
  if(!raw||!raw.trim())return null;
  const trimmed=raw.trim();
  if(trimmed.startsWith("ws://")||trimmed.startsWith("wss://"))return trimmed;
  if(trimmed.startsWith("https://"))return"wss://"+trimmed.slice(8);
  if(trimmed.startsWith("http://"))return"ws://"+trimmed.slice(7);
  return"wss://"+trimmed;
}

function addServer(type,prefilledUrl="",prefilledLabel=""){
  const id=nextId++;
  const row=document.createElement("div");row.style.cssText="display:flex;flex-direction:column;gap:0;";
  let labelInput=null;
  if(type==="codespace"){
    labelInput=document.createElement("input");labelInput.className="cs-label-input";labelInput.placeholder="Label this codespace…";labelInput.spellcheck=false;
    if(prefilledLabel)labelInput.value=prefilledLabel;row.appendChild(labelInput);
  } else {
    const ll=document.createElement("div");ll.textContent="LOCAL";ll.style.cssText="font-size:12px;font-weight:700;letter-spacing:.07em;color:var(--dc-text-muted);margin-bottom:6px;";row.appendChild(ll);
  }
  const bottomRow=document.createElement("div");bottomRow.style.cssText="display:flex;align-items:center;gap:7px;";
  const dot=document.createElement("span");dot.textContent="🔴";dot.title="Disconnected";
  const urlInput=document.createElement("input");urlInput.placeholder="wss://NAME-8082.preview.app.github.dev";urlInput.style.cssText="flex:1;min-width:80px;";
  if(type==="codespace"){
    const resolved=normaliseWsUrl(prefilledUrl);
    urlInput.value=resolved||"Paste Ur HTTP Here and rename it to wss://";
    urlInput.addEventListener("paste",e=>{
      e.preventDefault();
      const pasted=(e.clipboardData||window.clipboardData).getData("text");
      const converted=normaliseWsUrl(pasted);
      urlInput.value=converted||pasted;
      if(converted&&converted!==pasted)showToast("✅ Auto-converted to "+converted.slice(0,40)+"…");
    });
  }
  urlInput.style.display=type==="local"?"none":"";
  const connectBtn=document.createElement("button");connectBtn.textContent="Connect";connectBtn.className="btn-connect";
  const saveBtn=document.createElement("button");saveBtn.textContent="💾";saveBtn.title="Save URL";saveBtn.className="btn-save";saveBtn.style.display=type==="local"?"none":"";
  const removeBtn=document.createElement("button");removeBtn.textContent="✕";removeBtn.className="btn-remove";
  bottomRow.append(dot,urlInput,connectBtn,saveBtn,removeBtn);row.appendChild(bottomRow);HTML.serverList.appendChild(row);
  const entry={id,type,ws:null,dot,urlInput,connectBtn};servers.push(entry);
  let lastSavedUrl=prefilledUrl||"";
  function doSave(){const url=urlInput.value.trim(),label=labelInput?labelInput.value.trim():"";if(!url){saveBtn.textContent="⚠️";setTimeout(()=>saveBtn.textContent="💾",1500);return;}if(lastSavedUrl&&lastSavedUrl!==url)removeSaved(lastSavedUrl);upsertSaved(url,label);lastSavedUrl=url;saveBtn.textContent="✅";setTimeout(()=>saveBtn.textContent="💾",1800);}
  saveBtn.addEventListener("click",doSave);
  if(labelInput){let lt=null;labelInput.addEventListener("input",()=>{if(!lastSavedUrl)return;clearTimeout(lt);lt=setTimeout(()=>{const url=urlInput.value.trim();if(url)upsertSaved(url,labelInput.value.trim());},600);});}
  const resolveUrl=()=>{if(type==="local")return"ws://localhost:8082";const raw=urlInput.value.trim();if(!raw)return null;return normaliseWsUrl(raw);};
  function openWs(){
    const wsUrl=resolveUrl();if(!wsUrl){dot.textContent="⚠️";dot.title="No URL entered";return;}
    if(entry.ws)entry.ws.close();dot.textContent="🟡";dot.title="Connecting…";
    const ws=new WebSocket(wsUrl);ws.binaryType="arraybuffer";entry.ws=ws;
    ws.onopen=()=>{dot.textContent="🟢";dot.title="Connected";updateGlobalStatus();sendTo(ws,"M",72011);};
    ws.onmessage=m=>{
        const data=msgpack.decode(new Uint8Array(m.data));
        const ptype=data.shift();
        if(ptype==="M"){
          sendTo(ws,"C",data[0]^845);
          dot.title="Ready";
          sendTo(ws,"Z",tanks[HTML.tankSelect.value].tanks||HTML.tankSelect.value);
        } else if(ptype==="CHAT"){
          // Receive chat message broadcast from server
          const [text,username,role,ts]=data;
          if(!text||!username)return;
          // Avoid duplicate if we sent it ourselves
          const alreadyHave=_chatMessages.some(m=>m.ts===ts&&m.username===username&&m.text===text);
          if(alreadyHave)return;
          _chatMessages.push({text,username,displayName:username,role:role||"guest",ts:ts||Date.now()});
          if(_chatMessages.length>NC_CHAT_MAX)_chatMessages.splice(0,_chatMessages.length-NC_CHAT_MAX);
          ncChatRender();
          if(!_chatOpen){
            const badge=document.getElementById("ncChatUnread");
            if(badge){const cur=parseInt(badge.textContent)||0;const next=cur+1;badge.textContent=next>9?"9+":next;badge.classList.add("visible");}
          }
        }
      };
    ws.onerror=()=>{dot.textContent="❌";dot.title="Error — check port visibility and URL";updateGlobalStatus();};
    ws.onclose=e=>{if(dot.textContent!=="❌"){dot.textContent="🔴";dot.title=e.code===1006?"Abnormal close (1006) — port may be Private":`Disconnected (code ${e.code})`;}if(entry.ws===ws)entry.ws=null;updateGlobalStatus();};
  }
  connectBtn.addEventListener("click",openWs);
  removeBtn.addEventListener("click",()=>{if(entry.ws)entry.ws.close();servers=servers.filter(s=>s.id!==id);if(type==="codespace"){const url=urlInput.value.trim();if(url)removeSaved(url);}row.remove();updateGlobalStatus();});
  openWs();return entry;
}

// ─── PACKET HELPERS ───────────────────────────────────────────────────────────
const sendTo=(ws,...args)=>{if(ws&&ws.readyState===WebSocket.OPEN)ws.send(msgpack.encode(args));};
const packet=(...args)=>{for(const s of servers)sendTo(s.ws,...args);};
HTML.reconnectAll.addEventListener("click",()=>{for(const s of servers)s.connectBtn.click();});

// ─── TANK SELECT ──────────────────────────────────────────────────────────────
const TANKS_DEFAULT={
  basic:{name:"Basic"},auto6:{name:"Auto-4/6"},mega3:{name:"Mega-3"},rocket:{name:"Rocket (ram)"},
  anni:{name:"Annihilator"},shotgun:{name:"Shotgun"},pursuer:{name:"Pursuer"},engineer:{name:"Engineer"},
  assembler:{name:"Assembler"},architect:{name:"Architect"},firework:{name:"Firework"},
  coli:{name:"Collision"},levi:{name:"Leviathan"},spike:{name:"Spike"},thorn:{name:"Thorn"},
  slammer:{name:"Slammer"},basher:{name:"Basher"},phys:{name:"Physician"},
  triangle:{name:"Tri-Angle",tanks:["fighter","autotriangle","surfer","eagle","bomber","vulture","phoenix"]},
  triangle_ar:{name:"Tri-Angle (Arms race)",tanks:["browser","strider","autobomber","tripleautotriangle","surferdrive","electrocutor","kicker","megaautotriangle","roller","autoeagle"]},
  launchers:{name:"Launchers",tanks:["skimmer","twister","swarmer","sidewinder","fieldgun"]},
  launchers_ar:{name:"Launchers (Arms race)",tanks:["hyperskimmer","skidder","gyro","hypercluster","coli","molotov","hypertwister","ream"]},
  annies:{name:"Annihilators (Arms race)",tanks:["obliterator","compound","wiper","stomper","autoanni","shaver","eradicator"]},
  drones:{name:"Drones",tanks:["overczar","tyrant","autooverlord","megaautooverseer","tripleautooverseer","autooverdrive","headman","overcheese","overstorm"]},
  necro:{name:"Underseer (Arms race)",tanks:["diviner","autonecro","necrodrive","megaautounderdrive","tripleautounderdrive","pentamancer","pentadrive","warlock","autopentaseer"]},
  carriers:{name:"Carriers (Arms race)",tanks:["warship","battlerdrive","bismarck","proddrive","manufacture","dirigible","autobattleship","autoprod","autocruiserdrive"]},
  auto3:{name:"Auto-3",tanks:["auto5","mega3","auto6"]},
  auto3_ar:{name:"Auto-3 (Arms race)",tanks:["auto6","auto7","mega5","batter4","hurler3","autoauto4"]},
  dps:{name:"DPS",tanks:["penta","spread","octo","autogunner","triplet","predator","triplex","quadruplex","machinegunner"]},
  dps_ar:{name:"DPS (Arms race)",tanks:["toppler","coli","crack","autooperator","manufacture","lorry"]},
  smashers:{name:"Smashers",tanks:["megasmasher","spike","autosmasher","landmine"]},
  spikes_ar:{name:"Spikes (Arms race)",tanks:["thorn","megaspike","claymore","spear","prick"]},
  crash:{name:"Crash (Arms race)",tanks:["whirlwind","tempest","septamech","doubleequalizer","rigger","lorry","manufacture","doublespread","palisade"]}
};
let tanks=JSON.parse(JSON.stringify(TANKS_DEFAULT));
function rebuildTankSelect(){
  const prev=HTML.tankSelect.value;HTML.tankSelect.innerHTML="";let added=false;
  for(const key in tanks){
    if(!Object.hasOwn(tanks,key))continue;
    if(!added&&tanks[key].tanks){HTML.tankSelect.innerHTML+="<option disabled></option><option disabled>── Branches ──</option>";added=true;}
    HTML.tankSelect.innerHTML+=`<option value="${key}">${tanks[key].name}</option>`;
  }
  if(tanks[prev])HTML.tankSelect.value=prev;
  // also rebuild compact select
  const prev2=HTML.compactTankSelect.value;
  HTML.compactTankSelect.innerHTML=HTML.tankSelect.innerHTML;
  if(tanks[prev2])HTML.compactTankSelect.value=prev2;
  else HTML.compactTankSelect.value=HTML.tankSelect.value;
}
rebuildTankSelect();
HTML.tankSelect.addEventListener("change",()=>{
  const val=HTML.tankSelect.value;
  packet("Z",tanks[val].tanks||val);
  HTML.compactTankSelect.value=val;
});

// ─── TANKS EDITOR ─────────────────────────────────────────────────────────────
let tanksEditorOpen=false;
function teGetProjection(mode){
  if(mode==="full")return"const tanks = "+JSON.stringify(tanks,null,2)+";";
  if(mode==="keys")return"// Tank keys ("+Object.keys(tanks).length+" total)\nconst tankKeys = "+JSON.stringify(Object.keys(tanks),null,2)+";";
  if(mode==="names"){const n={};for(const k in tanks)n[k]=tanks[k].name;return"// key → display name\nconst tankNames = "+JSON.stringify(n,null,2)+";";}
  if(mode==="groups"){const g={};for(const k in tanks)if(tanks[k].tanks)g[k]={name:tanks[k].name,tanks:tanks[k].tanks};return"// Only entries with a tanks[] array\nconst tankGroups = "+JSON.stringify(g,null,2)+";";}
  return"";
}
function teRender(){HTML.teTankEditor.value=teGetProjection(HTML.teProjSelect.value);HTML.teTankEditor.classList.remove("te-error");teSetStatus("","");}
function teSetStatus(msg,type){HTML.teStatus.textContent=msg||(HTML.teProjSelect.value==="full"?"Apply to update the tank selector.":"Switch to Full const to edit and apply changes.");HTML.teStatus.className="te-status"+(type?" "+type:"");}
HTML.ncTanksBtn.addEventListener("click",()=>{tanksEditorOpen=!tanksEditorOpen;HTML.ncTanksPanel.classList.toggle("open",tanksEditorOpen);HTML.ncTanksBtn.style.color=tanksEditorOpen?"var(--dc-blurple-light)":"";if(tanksEditorOpen)teRender();});
HTML.teProjSelect.addEventListener("change",teRender);
HTML.teTankEditor.addEventListener("input",()=>{if(HTML.teProjSelect.value!=="full")return;try{JSON.parse(HTML.teTankEditor.value.replace(/^const tanks\s*=\s*/,"").replace(/;?\s*$/,""));HTML.teTankEditor.classList.remove("te-error");teSetStatus("✓ Valid JSON","ok");}catch{HTML.teTankEditor.classList.add("te-error");teSetStatus("✗ Invalid JSON — fix before applying","err");}});
HTML.teApplyBtn.addEventListener("click",()=>{if(HTML.teProjSelect.value!=="full"){teSetStatus("Switch to Full const to apply edits.","err");return;}try{tanks=JSON.parse(HTML.teTankEditor.value.replace(/^const tanks\s*=\s*/,"").replace(/;?\s*$/,""));rebuildTankSelect();HTML.teTankEditor.classList.remove("te-error");teSetStatus("✓ Applied — tank selector updated!","ok");setTimeout(()=>teSetStatus("",""),2500);}catch{HTML.teTankEditor.classList.add("te-error");teSetStatus("✗ Invalid JSON — couldn't apply","err");}});
HTML.teCopyBtn.addEventListener("click",()=>{navigator.clipboard.writeText(HTML.teTankEditor.value).then(()=>{const p=HTML.teCopyBtn.textContent;HTML.teCopyBtn.textContent="Copied!";setTimeout(()=>HTML.teCopyBtn.textContent=p,1800);});});
HTML.teResetBtn.addEventListener("click",()=>{tanks=JSON.parse(JSON.stringify(TANKS_DEFAULT));rebuildTankSelect();teRender();teSetStatus("✓ Reset to defaults","ok");setTimeout(()=>teSetStatus("",""),2000);});

// ─── ADD BUTTONS ──────────────────────────────────────────────────────────────
HTML.addLocal.addEventListener("click",()=>addServer("local"));
HTML.addSpace.addEventListener("click",()=>addServer("codespace"));
function ncInitServers(){
  addServer("local");
  const saved=getSaved();
  if(saved.length>0){for(const{url,label}of saved)addServer("codespace",url,label);}
  else addServer("codespace");
}
if(!window._ncRequireLogin){ncInitServers();}

// ─── AUTO-ROTATE ──────────────────────────────────────────────────────────────
let autoRotateEnabled=false,autoRotateActive=false,autoRotateAngle=0;
const ROTATE_SPEED=0.04,ROTATE_RADIUS=120;
let autoRotateCycleTimer=null,autoRotateCycleEnd=0;
const randomCycleMs=()=>(Math.random()*5+10)*60*1000;
function updateRotateBtn(){
  const btn=HTML.autoRotateBtn,te=HTML.autoRotateTimer;
  if(!autoRotateEnabled){btn.textContent="↻ Auto Rotate: OFF";btn.classList.remove("active");te.classList.remove("visible");return;}
  btn.textContent=autoRotateActive?"↻ Auto Rotate: SPINNING":"↻ Auto Rotate: PAUSED";
  btn.classList.toggle("active",autoRotateActive);te.classList.add("visible");
}
function scheduleCycle(){
  if(autoRotateCycleTimer)clearTimeout(autoRotateCycleTimer);
  const dur=randomCycleMs();autoRotateCycleEnd=Date.now()+dur;
  autoRotateCycleTimer=setTimeout(()=>{autoRotateActive=!autoRotateActive;updateRotateBtn();if(autoRotateEnabled)scheduleCycle();},dur);
  updateRotateBtn();
}
function stopCycle(){if(autoRotateCycleTimer)clearTimeout(autoRotateCycleTimer);autoRotateCycleTimer=null;autoRotateCycleEnd=0;HTML.autoRotateTimer.classList.remove("visible");}
HTML.autoRotateBtn.addEventListener("click",()=>{autoRotateEnabled=!autoRotateEnabled;if(autoRotateEnabled){autoRotateActive=true;scheduleCycle();}else{autoRotateActive=false;stopCycle();}updateRotateBtn();});
setInterval(()=>{
  if(!autoRotateEnabled||!autoRotateCycleEnd)return;
  const left=autoRotateCycleEnd-Date.now();
  HTML.autoRotateTimer.textContent=`Auto ${autoRotateActive?"pausing in":"spinning in"} ${left<=0?"0s":((m=Math.floor(Math.ceil(left/1000)/60))>0?`${m}m ${Math.ceil(left/1000)%60}s`:`${Math.ceil(left/1000)}s`)}`;
},1000);

// ─── STAY PUT & GROWTH MODE ───────────────────────────────────────────────────
let stayPut=false,growthMode=false;
HTML.stayPutBtn.addEventListener("click",()=>{stayPut=!stayPut;HTML.stayPutBtn.textContent=stayPut?"📍 Stay Put: ON":"📍 Stay Put: OFF";HTML.stayPutBtn.classList.toggle("active",stayPut);});
HTML.growthModeBtn.addEventListener("click",()=>{growthMode=!growthMode;HTML.growthModeBtn.textContent=growthMode?"🌱 Growth Mode: ON":"🌱 Growth Mode: OFF";HTML.growthModeBtn.classList.toggle("active",growthMode);});

// ─── MOD SYSTEM ───────────────────────────────────────────────────────────────
const modRegistry=[];
let modsOpen=false;
window.registerMod=function registerMod(def){
  if(!def||typeof def.tick!=="function"){console.warn("[NC Mods] registerMod: tick must be a function");return null;}
  const name=def.name||"Unnamed Mod";
  const existingIdx=modRegistry.findIndex(m=>m.name===name);
  const mod={name,icon:def.icon||"🔧",description:def.description||"",tick:def.tick,active:false,builtin:def.builtin||false,_btn:null};
  if(existingIdx>=0){mod.active=modRegistry[existingIdx].active;modRegistry[existingIdx]._btn?.remove();modRegistry.splice(existingIdx,1,mod);}
  else modRegistry.push(mod);
  renderModGrids();return mod;
};
function setActiveMod(targetMod){const wasActive=targetMod.active;modRegistry.forEach(m=>{m.active=false;m._btn?.classList.remove("active");});if(!wasActive){targetMod.active=true;targetMod._btn?.classList.add("active");}}
function makeModButton(mod){const btn=document.createElement("button");btn.className="nc-mod-btn"+(mod.builtin?"":" custom-mod");btn.title=mod.description||mod.name;btn.innerHTML=`<span class="mod-icon">${mod.icon}</span>${mod.name}`;if(mod.active)btn.classList.add("active");btn.addEventListener("click",()=>setActiveMod(mod));mod._btn=btn;return btn;}
function renderModGrids(){HTML.ncBuiltinModGrid.innerHTML="";HTML.ncCustomModGrid.innerHTML="";let hasCustom=false;for(const mod of modRegistry){const btn=makeModButton(mod);if(mod.builtin)HTML.ncBuiltinModGrid.appendChild(btn);else{HTML.ncCustomModGrid.appendChild(btn);hasCustom=true;}}HTML.ncCustomModGrid.style.display=hasCustom?"grid":"none";}
HTML.ncModsBtn.addEventListener("click",()=>{modsOpen=!modsOpen;HTML.ncModsPanel.classList.toggle("open",modsOpen);HTML.ncModsBtn.style.color=modsOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";});
const stripUserscriptHeader=code=>code.replace(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/i,"").replace(/^\s*\n/,"").trim();
function loadModFromCode(rawCode){
  const status=HTML.ncModStatus;
  if(!rawCode.trim()){status.textContent="⚠️ Nothing to load";status.className="nc-mod-status err";return;}
  const isUserScript=/\/\/\s*==UserScript==/i.test(rawCode);
  const code=isUserScript?stripUserscriptHeader(rawCode):rawCode;
  if(!code.trim()){status.textContent="⚠️ Script body is empty after stripping header";status.className="nc-mod-status err";return;}
  try{
    const prevCount=modRegistry.length;
    new Function("registerMod",code)(window.registerMod);
    const added=modRegistry.length-prevCount;
    const tag=isUserScript?" (userscript)":"";
    status.textContent=added>0?`✓ Loaded${tag} — ${modRegistry.length} mod(s) total`:`✓ Updated existing mod${tag}`;
    status.className="nc-mod-status ok";HTML.ncModEditor.classList.remove("mod-err");
    setTimeout(()=>{status.textContent="";status.className="nc-mod-status";},3000);
  }catch(err){status.textContent="✗ "+err.message;status.className="nc-mod-status err";HTML.ncModEditor.classList.add("mod-err");}
}
HTML.ncModLoadBtn.addEventListener("click",()=>loadModFromCode(HTML.ncModEditor.value));
HTML.ncModEditor.addEventListener("input",()=>HTML.ncModEditor.classList.remove("mod-err"));
HTML.ncModFileBtn.addEventListener("click",()=>HTML.ncModFile.click());
HTML.ncModFile.addEventListener("change",e=>{const file=e.target.files[0];HTML.ncModFile.value="";if(!file)return;const reader=new FileReader();reader.onload=evt=>{const raw=evt.target.result;HTML.ncModEditor.value=/\/\/\s*==UserScript==/i.test(raw)?stripUserscriptHeader(raw):raw;loadModFromCode(raw);};reader.onerror=()=>showToast("❌ Failed to read mod file",true);reader.readAsText(file);});
HTML.ncModClearCustomBtn.addEventListener("click",()=>{for(let i=modRegistry.length-1;i>=0;i--){if(!modRegistry[i].builtin){modRegistry[i]._btn?.remove();modRegistry.splice(i,1);}}renderModGrids();HTML.ncModStatus.textContent="✓ Custom mods cleared";HTML.ncModStatus.className="nc-mod-status ok";setTimeout(()=>{HTML.ncModStatus.textContent="";HTML.ncModStatus.className="nc-mod-status";},2000);});

// Built-in mods
let _orbitAngle=0,_spiralAngle=0,_spiralR=0;
window.registerMod({name:"Repel",  icon:"↩️",builtin:true,description:"Bots flee from your cursor",   tick:({mouseX,mouseY})=>({bx:-mouseX/15,by:-mouseY/15})});
window.registerMod({name:"Charge", icon:"💨",builtin:true,description:"Bots rush hard toward your cursor",tick:({mouseX,mouseY})=>({bx:mouseX*3,by:mouseY*3})});
window.registerMod({name:"Jitter", icon:"⚡",builtin:true,description:"Random erratic movement",tick:()=>{const a=Math.random()*Math.PI*2;return{bx:Math.cos(a)*80,by:Math.sin(a)*80};}});
window.registerMod({name:"Orbit",  icon:"🌀",builtin:true,description:"Bots smoothly orbit around you",tick:()=>{_orbitAngle+=0.06;return{bx:Math.cos(_orbitAngle)*150,by:Math.sin(_orbitAngle)*150};}});
window.registerMod({name:"Spiral", icon:"🎡",builtin:true,description:"Bots spiral outward then reset",tick:()=>{_spiralAngle+=0.05;_spiralR=(_spiralR+1)%180;return{bx:Math.cos(_spiralAngle)*_spiralR,by:Math.sin(_spiralAngle)*_spiralR};}});
window.registerMod({name:"Mirror", icon:"🔁",builtin:true,description:"Flip horizontal movement axis",tick:({mouseX,mouseY})=>({bx:-mouseX/15,by:mouseY/15})});

// ─── KEYS & MOUSE ─────────────────────────────────────────────────────────────
let keys={};
window.addEventListener("keydown",e=>{const tag=e.target.tagName;const inInput=tag==="INPUT"||tag==="TEXTAREA"||e.target.isContentEditable;if(inInput)return;if(keys[e.code])return;keys[e.code]=true;if(e.code==="Escape")menu.style.display=menu.style.display==="none"?"block":"none";});
window.addEventListener("keyup",e=>{keys[e.code]=false;});
let mouseX=0,mouseY=0,mouseDown=false,rMouseDown=false;
HTMLDivElement.prototype.nListener=HTMLDivElement.prototype.addEventListener;
HTMLDivElement.prototype.addEventListener=function(...args){
  if(args[0]==="mousemove"&&args[1].toString()==="e=>{e.isTrusted&&(n.push(2,e.clientX,e.clientY),t())}"){
    this.addEventListener("mousedown",e=>{if(e.button===0)mouseDown=true;else if(e.button===2)rMouseDown=true;});
    this.addEventListener("mouseup",e=>{if(e.button===0)mouseDown=false;else if(e.button===2)rMouseDown=false;});
    this.addEventListener("mousemove",e=>{mouseX=e.clientX-innerWidth/2;mouseY=e.clientY-innerHeight/2;});
  }
  this.nListener.apply(this,args);
};

// ─── FREE PLAN UPGRADE POPUP ──────────────────────────────────────────────────
const NC_UPGRADE_MSGS=[
  {emoji:"🚀",title:"Whoa there, bot master!",msg:"You just spawned a bot like it's nothing. Imagine doing that <strong>without limits</strong>. Upgrade and unleash the full chaos."},
  {emoji:"😅",title:"Oh, you're still on Free?",msg:"Your bots are working hard for you. Too bad they're the only ones working. Upgrade to <strong>Beta</strong> and let the real features clock in."},
  {emoji:"👀",title:"We see you spawning bots...",msg:"Don't worry, we won't tell anyone. But we will keep showing you this popup <strong>every single time</strong> until you upgrade. Your call."},
  {emoji:"💀",title:"Free user detected.",msg:"Spawning bots on the free plan is like bringing a knife to a gun fight. Upgrade to <strong>Beta</strong> and actually compete."},
  {emoji:"🎁",title:"Upgrade. Do it. NOW.",msg:"Beta users get themes, mods, the AI, layout editor, and more. You're out here with the <strong>bare minimum</strong>. Don't you deserve better?"},
  {emoji:"😤",title:"ANOTHER bot spawn?",msg:"Bold of you to keep clicking that button. You know what would be even bolder? <strong>Getting Beta access</strong> and actually having fun."},
  {emoji:"🤡",title:"Free plan gang...",msg:"Nothing wrong with free... except the themes, mods, AI, commands, and layout editor you're missing. Upgrade and stop clowning around."},
  {emoji:"⚡",title:"Did someone say BOT SPAM?",msg:"That's the spirit! Now imagine doing it with <strong>mods, auto-rotate presets, and custom movement</strong>. Beta has all that. Just saying."},
  {emoji:"🏆",title:"You could be a Beta tester.",msg:"Real ones run mods, custom themes, and the command prompt. You're out here clicking buttons like it's 2015. <strong>Level up.</strong>"},
  {emoji:"😭",title:"This popup again? Really?",msg:"Yeah. Every time. We told you. Just <strong>request an upgrade</strong> and this all goes away. Or keep clicking — we're patient."},
];

let _upgradePopupOpen=false;
let _upgradeMsgIdx=0;

function ncIsFreePlan(){
  const acc=window._ncCurrentAcc;
  if(!acc)return false;
  return acc.role==="free"||acc.role==="demo"||(acc.username==="Guest"&&acc.role==="free");
}

function ncShowUpgradePopup(onContinue){
  if(_upgradePopupOpen)return;
  _upgradePopupOpen=true;

  const msg=NC_UPGRADE_MSGS[_upgradeMsgIdx%NC_UPGRADE_MSGS.length];
  _upgradeMsgIdx++;

  const overlay=document.createElement("div");overlay.id="ncUpgradeOverlay";
  overlay.innerHTML=`
  <div id="ncUpgradeBox">
    <div class="nc-upgrade-badge">✨ Free Plan</div>
    <span class="nc-upgrade-emoji">${msg.emoji}</span>
    <div class="nc-upgrade-title">${msg.title}</div>
    <div class="nc-upgrade-msg">${msg.msg}</div>
    <button id="ncUpgradeBtn">🚀 Request Beta Access</button>
    <br>
    <button id="ncUpgradeDismiss">No thanks, I enjoy suffering</button>
  </div>`;
  document.body.appendChild(overlay);

  // Dismiss button appears after 2.5s — makes it slightly annoying to close
  const dismissBtn=overlay.querySelector("#ncUpgradeDismiss");
  setTimeout(()=>dismissBtn.classList.add("visible"),2500);

  function close(){
    overlay.style.animation="ncUpgradeFade .15s ease forwards";
    overlay.style.opacity="0";
    setTimeout(()=>{overlay.remove();_upgradePopupOpen=false;},150);
  }

  overlay.querySelector("#ncUpgradeBtn").addEventListener("click",()=>{
    close();
    // Open owner panel if owner exists, otherwise show a note
    showToast("📨 Contact the owner to request Beta access!");
  });

  dismissBtn.addEventListener("click",()=>{
    close();
    if(typeof onContinue==="function")onContinue();
  });

  // Also run onContinue even if they clicked upgrade (bots still spawn)
  overlay.querySelector("#ncUpgradeBtn").addEventListener("click",()=>{
    if(typeof onContinue==="function")onContinue();
  },{once:true});
}

// ─── BOT CONTROLS ─────────────────────────────────────────────────────────────
HTML.connectNoob.addEventListener("click",()=>{
  const hash=HTML.serverHash.value?.replace("#","")||location.hash.slice(1);
  if(ncIsFreePlan()){
    ncShowUpgradePopup(()=>packet("F",hash));
  } else {
    packet("F",hash);
  }
});
HTML.spawnMulti.addEventListener("click",()=>{
  const hash=HTML.serverHash.value?.replace("#","")||location.hash.slice(1);
  const count=Math.max(1,parseInt(HTML.botCount.value)||1);
  if(ncIsFreePlan()){
    ncShowUpgradePopup(()=>{for(let i=0;i<count;i++)setTimeout(()=>packet("F",hash),i*150);});
  } else {
    for(let i=0;i<count;i++)setTimeout(()=>packet("F",hash),i*150);
  }
});
HTML.deleteNoobs.addEventListener("click",()=>packet("B"));

// ─── BOT CHAT ─────────────────────────────────────────────────────────────────
// Sends ["BOTCHAT", text] to the server, which forwards {type:"chat"} to every
// bot worker — each bot calls controller.chat(str) to say it in-game.
function sendBotChat(){
  const inp=document.getElementById("botChatInput");
  if(!inp)return;
  const text=inp.value.trim();
  if(!text)return;
  inp.value="";
  packet("BOTCHAT",text);
  showToast("💬 Bots say: "+text.slice(0,40)+(text.length>40?"…":""));
}
document.getElementById("botChatSend").addEventListener("click",sendBotChat);
document.getElementById("botChatInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();e.stopPropagation();sendBotChat();}
});
// Block game keys while typing in bot chat
document.getElementById("botChatInput").addEventListener("keydown",e=>e.stopPropagation());
document.getElementById("botChatInput").addEventListener("keyup",e=>e.stopPropagation());

// ─── COORDS INTERCEPT ─────────────────────────────────────────────────────────
let x,y;
const _origStrokeText=CanvasRenderingContext2D.prototype.strokeText;
CanvasRenderingContext2D.prototype.strokeText=function(...args){
  if(args[0].includes("Coordinates: (")){const[cx,cy]=args[0].match(/Coordinates: \(([^)]+)\)/)[1].split(", ");x=parseFloat(cx);y=parseFloat(cy);}
  _origStrokeText.apply(this,args);
};

// ─── BROADCAST LOOP ───────────────────────────────────────────────────────────
setInterval(()=>{
  let bx,by;
  const activeMod=modRegistry.find(m=>m.active);
  if(activeMod){const r=activeMod.tick({x,y,mouseX,mouseY,mouseDown,rMouseDown,keys});bx=r?.bx??0;by=r?.by??0;}
  else if(stayPut){bx=0;by=0;}
  else if(autoRotateEnabled&&autoRotateActive){autoRotateAngle+=ROTATE_SPEED;bx=Math.cos(autoRotateAngle)*ROTATE_RADIUS;by=Math.sin(autoRotateAngle)*ROTATE_RADIUS;}
  else if(growthMode){bx=x+mouseX;by=y+mouseY;}
  else{bx=mouseX/15;by=mouseY/15;}
  packet("A",x,y,bx,by,mouseDown,rMouseDown,HTML.mbs.checked,HTML.feeding.checked,keys["ShiftLeft"]);
},80);

// ─── COMMAND PROMPT ───────────────────────────────────────────────────────────
const TANK_ALIASES={
  basic:"basic",
  tri:"triangle","tri-angle":"triangle",triangle:"triangle",
  "tri-angle-ar":"triangle_ar","triangle-ar":"triangle_ar",trianlgear:"triangle_ar",
  anni:"anni",annihilator:"anni",
  rocket:"rocket",ram:"rocket",
  shotgun:"shotgun",pursuer:"pursuer",engineer:"engineer",
  assembler:"assembler",architect:"architect",
  spike:"spike",thorn:"thorn",slammer:"slammer",basher:"basher",
  levi:"levi",leviathan:"levi",
  coli:"coli",collision:"coli",
  firework:"firework",phys:"phys",physician:"phys",
  auto3:"auto3",auto6:"auto6",mega3:"mega3",
  "auto3-ar":"auto3_ar","auto3ar":"auto3_ar",
  launchers:"launchers","launchers-ar":"launchers_ar","launcherar":"launchers_ar",
  annies:"annies",
  drones:"drones",
  necro:"necro",underseer:"necro",
  carriers:"carriers",
  dps:"dps","dps-ar":"dps_ar","dpsar":"dps_ar",
  smashers:"smashers",
  "spikes-ar":"spikes_ar","spikesar":"spikes_ar",
  crash:"crash",
};

let cmdHistory=[],cmdHistIdx=-1,cmdOpen=false;

function cmdLog(text,cls="nc-cmd-info"){
  const d=document.createElement("div");
  d.className="nc-cmd-line "+cls;
  d.textContent=text;
  HTML.ncCmdLog.appendChild(d);
  HTML.ncCmdLog.scrollTop=HTML.ncCmdLog.scrollHeight;
}

function resolveTankAlias(raw){
  if(!raw)return null;
  const k=raw.toLowerCase().replace(/\s+/g,"-").replace(/_/g,"-");
  return TANK_ALIASES[k]||TANK_ALIASES[raw.toLowerCase()]||null;
}

function runCmd(raw){
  const trimmed=raw.trim();if(!trimmed)return;
  cmdLog("> "+trimmed,"nc-cmd-echo");
  cmdHistory.unshift(trimmed);cmdHistIdx=-1;

  const parts=trimmed.split(/\s+/);
  const cmd=parts[0].toLowerCase();

  if(cmd==="?help"){
    cmdLog("━━ Commands ━━━━━━━━━━━━━━━━━━━━━━━━━━━","nc-cmd-sys");
    cmdLog("?spawn <hash> <count> [tank]   — spawn bots","nc-cmd-info");
    cmdLog("?kill                          — kill all bots","nc-cmd-info");
    cmdLog("?tank <name>                   — switch tank","nc-cmd-info");
    cmdLog("?feed on|off                   — toggle feeding","nc-cmd-info");
    cmdLog("?mode rotate|stayput|growth|normal","nc-cmd-info");
    cmdLog("?list tanks                    — show tank aliases","nc-cmd-info");
    cmdLog("?say <message>                 — bots say in-game","nc-cmd-info");
    cmdLog("?clear                         — clear this log","nc-cmd-info");
    cmdLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━","nc-cmd-sys");
    return;
  }
  if(cmd==="?clear"){HTML.ncCmdLog.innerHTML="";return;}
  if(cmd==="?kill"){packet("B");cmdLog("✓ Kill packet sent — all bots terminated","nc-cmd-ok");return;}
  if(cmd==="?list"){
    const sub=(parts[1]||"").toLowerCase();
    if(sub==="tanks"){
      cmdLog("━━ Tank aliases ━━━━━━━━━━━━━━━━━━━━━━━","nc-cmd-sys");
      const seen=new Set();
      for(const[alias,key]of Object.entries(TANK_ALIASES)){
        if(seen.has(alias))continue;seen.add(alias);
        cmdLog(`  ${alias.padEnd(18)} → ${tanks[key]?.name||key}`,"nc-cmd-info");
      }
    } else {cmdLog("Usage: ?list tanks","nc-cmd-err");}
    return;
  }
  if(cmd==="?tank"){
    const raw=parts.slice(1).join(" ");
    const resolved=resolveTankAlias(raw);
    if(!resolved){cmdLog(`Unknown tank: "${raw}" — try ?list tanks`,"nc-cmd-err");return;}
    const tankVal=tanks[resolved]?.tanks||resolved;
    packet("Z",tankVal);
    if(tanks[resolved])HTML.tankSelect.value=resolved;
    cmdLog(`✓ Switched to ${tanks[resolved]?.name||resolved}`,"nc-cmd-ok");
    return;
  }
  if(cmd==="?feed"){
    const val=(parts[1]||"").toLowerCase();
    if(val!=="on"&&val!=="off"){cmdLog("Usage: ?feed on|off","nc-cmd-err");return;}
    HTML.feeding.checked=val==="on";
    cmdLog(`✓ Feeding ${val.toUpperCase()}`,"nc-cmd-ok");
    return;
  }
  if(cmd==="?mode"){
    const m=(parts[1]||"").toLowerCase();
    if(m==="rotate"){
      stayPut=false;growthMode=false;
      if(!autoRotateEnabled){autoRotateEnabled=true;autoRotateActive=true;scheduleCycle();}
      HTML.stayPutBtn.textContent="📍 Stay Put: OFF";HTML.stayPutBtn.classList.remove("active");
      HTML.growthModeBtn.textContent="🌱 Growth Mode: OFF";HTML.growthModeBtn.classList.remove("active");
      cmdLog("✓ Mode: Auto Rotate ON","nc-cmd-ok");
    } else if(m==="stayput"||m==="stay"){
      stayPut=true;growthMode=false;autoRotateEnabled=false;autoRotateActive=false;stopCycle();updateRotateBtn();
      HTML.stayPutBtn.textContent="📍 Stay Put: ON";HTML.stayPutBtn.classList.add("active");
      HTML.growthModeBtn.textContent="🌱 Growth Mode: OFF";HTML.growthModeBtn.classList.remove("active");
      cmdLog("✓ Mode: Stay Put ON","nc-cmd-ok");
    } else if(m==="growth"||m==="grow"){
      growthMode=true;stayPut=false;autoRotateEnabled=false;autoRotateActive=false;stopCycle();updateRotateBtn();
      HTML.growthModeBtn.textContent="🌱 Growth Mode: ON";HTML.growthModeBtn.classList.add("active");
      HTML.stayPutBtn.textContent="📍 Stay Put: OFF";HTML.stayPutBtn.classList.remove("active");
      cmdLog("✓ Mode: Growth Mode ON","nc-cmd-ok");
    } else if(m==="normal"){
      stayPut=false;growthMode=false;autoRotateEnabled=false;autoRotateActive=false;stopCycle();updateRotateBtn();
      HTML.stayPutBtn.textContent="📍 Stay Put: OFF";HTML.stayPutBtn.classList.remove("active");
      HTML.growthModeBtn.textContent="🌱 Growth Mode: OFF";HTML.growthModeBtn.classList.remove("active");
      cmdLog("✓ Mode: Normal (follow mouse)","nc-cmd-ok");
    } else {cmdLog("Modes: rotate | stayput | growth | normal","nc-cmd-err");}
    return;
  }
  if(cmd==="?spawn"){
    const hash=parts[1];
    const count=parseInt(parts[2]);
    const tankRaw=parts.slice(3).join(" ");
    if(!hash){cmdLog("Usage: ?spawn <hash> <count> [tank]","nc-cmd-err");return;}
    if(!count||count<1||count>500){cmdLog(`Count must be 1–500. Got: ${parts[2]}`,"nc-cmd-err");return;}
    let tankLabel="current tank";
    if(tankRaw){
      const resolved=resolveTankAlias(tankRaw);
      if(!resolved){cmdLog(`Unknown tank: "${tankRaw}" — try ?list tanks`,"nc-cmd-err");return;}
      tankLabel=tanks[resolved]?.name||resolved;
      packet("Z",tanks[resolved]?.tanks||resolved);
      if(tanks[resolved])HTML.tankSelect.value=resolved;
    }
    const delay=Math.min(200,Math.max(80,Math.floor(10000/count)));
    cmdLog(`Spawning ${count}× ${tankLabel} into #${hash} (${delay}ms stagger)…`,"nc-cmd-sys");
    for(let i=0;i<count;i++)setTimeout(()=>packet("F",hash),i*delay);
    cmdLog(`✓ ${count} spawn packets queued`,"nc-cmd-ok");
    return;
  }
  if(cmd==="?say"){
    const text=parts.slice(1).join(" ").trim();
    if(!text){cmdLog("Usage: ?say <message>","nc-cmd-err");return;}
    packet("BOTCHAT",text.slice(0,120));
    cmdLog(`✓ Bots will say: ${text.slice(0,60)}${text.length>60?"…":""}`,"nc-cmd-ok");
    return;
  }
  cmdLog(`Unknown command: ${cmd} — type ?help`,"nc-cmd-err");
}

// Command prompt toggle
let cmdPanelOpen=false;
const ncCmdToggle=document.createElement("button");
ncCmdToggle.className="nc-icon-btn";
ncCmdToggle.id="ncCmdBtn";
ncCmdToggle.title="Command Prompt";
ncCmdToggle.textContent="💻 CMD";
HTML.ncStatus.parentNode.insertBefore(ncCmdToggle,$("ncStatus"));

// Remove CMD button for free/guest/demo users
if(window._ncCurrentAcc&&(window._ncCurrentAcc.role==="free"||window._ncCurrentAcc.role==="demo")){ncCmdToggle.remove();}

ncCmdToggle.addEventListener("click",()=>{
  cmdPanelOpen=!cmdPanelOpen;
  HTML.ncCmdPanel.classList.toggle("open",cmdPanelOpen);
  ncCmdToggle.style.color=cmdPanelOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";
  if(cmdPanelOpen){
    if(HTML.ncCmdLog.children.length===0){
      cmdLog("Noob Controller CMD — type ?help to get started","nc-cmd-sys");
      cmdLog("?spawn <hash> <count> [tank]  to spawn bots","nc-cmd-info");
    }
    HTML.ncCmdInput.focus();
  }
});

HTML.ncCmdRunBtn.addEventListener("click",()=>{runCmd(HTML.ncCmdInput.value);HTML.ncCmdInput.value="";});
HTML.ncCmdInput.addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();runCmd(HTML.ncCmdInput.value);HTML.ncCmdInput.value="";}
  else if(e.key==="ArrowUp"){e.preventDefault();if(cmdHistory.length){cmdHistIdx=Math.min(cmdHistIdx+1,cmdHistory.length-1);HTML.ncCmdInput.value=cmdHistory[cmdHistIdx];}}
  else if(e.key==="ArrowDown"){e.preventDefault();if(cmdHistIdx>0){cmdHistIdx--;HTML.ncCmdInput.value=cmdHistory[cmdHistIdx];}else{cmdHistIdx=-1;HTML.ncCmdInput.value="";}}
});

// ─── HELP PANEL ───────────────────────────────────────────────────────────────
let helpOpen=false;
HTML.ncHelpBtn.addEventListener("click",()=>{
  helpOpen=!helpOpen;
  HTML.ncHelpPanel.classList.toggle("open",helpOpen);
  HTML.ncHelpBtn.style.color=helpOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";
});

// Populate alias pills in help panel
(()=>{
  const seen=new Set();
  for(const[alias,key]of Object.entries(TANK_ALIASES)){
    if(seen.has(alias))continue;seen.add(alias);
    const pill=document.createElement("span");
    pill.className="nc-help-alias";
    pill.textContent=`${alias} → ${tanks[key]?.name||key}`;
    HTML.ncHelpAliases.appendChild(pill);
  }
})();

// ─── CODESPACE GUIDE PANEL ───────────────────────────────────────────────────
let guideOpen=false;
HTML.ncGuideBtn.addEventListener("click",()=>{
  guideOpen=!guideOpen;
  HTML.ncGuidePanel.classList.toggle("open",guideOpen);
  HTML.ncGuideBtn.style.color=guideOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";
});

// Guide URL converter logic
function getConvertedUrl(){
  return normaliseWsUrl(HTML.ncGuideUrlInput.value.trim());
}
HTML.ncGuideUrlInput.addEventListener("input",()=>{
  const converted=getConvertedUrl();
  if(converted&&(HTML.ncGuideUrlInput.value.trim().startsWith("http")||HTML.ncGuideUrlInput.value.trim().startsWith("wss")||HTML.ncGuideUrlInput.value.trim().startsWith("ws"))){
    HTML.ncGuideUrlResult.textContent="→ "+converted;
    HTML.ncGuideUrlResult.classList.add("visible");
  } else {
    HTML.ncGuideUrlResult.classList.remove("visible");
  }
});
HTML.ncGuideUrlInput.addEventListener("paste",e=>{
  e.preventDefault();
  const pasted=(e.clipboardData||window.clipboardData).getData("text");
  const converted=normaliseWsUrl(pasted);
  HTML.ncGuideUrlInput.value=converted||pasted;
  if(converted){
    HTML.ncGuideUrlResult.textContent="→ "+converted;
    HTML.ncGuideUrlResult.classList.add("visible");
  }
});
HTML.ncGuideUrlCopy.addEventListener("click",()=>{
  const converted=getConvertedUrl();
  if(!converted){showToast("⚠️ Enter a URL first",true);return;}
  navigator.clipboard.writeText(converted).then(()=>{
    const p=HTML.ncGuideUrlCopy.textContent;
    HTML.ncGuideUrlCopy.textContent="Copied!";
    setTimeout(()=>HTML.ncGuideUrlCopy.textContent=p,1800);
  });
});
HTML.ncGuideUrlUse.addEventListener("click",()=>{
  const converted=getConvertedUrl();
  if(!converted){showToast("⚠️ Enter a URL first",true);return;}
  addServer("codespace",converted,"");
  HTML.serverList.scrollIntoView({behavior:"smooth",block:"nearest"});
  showToast("✅ Server added — connecting…");
  HTML.ncGuideUrlInput.value="";
  HTML.ncGuideUrlResult.classList.remove("visible");
});


// ─── MEDIA PLAYER (v0.25 - FIXED) ──────────────────────────────────────────
let mediaOpen=false;
let _activeMedia=null;

HTML.ncMediaBtn.addEventListener("click",()=>{
  mediaOpen=!mediaOpen;
  HTML.ncMediaPanel.classList.toggle("open",mediaOpen);
  HTML.ncMediaBtn.style.color=mediaOpen?"var(--dc-blurple-light)":"var(--dc-text-muted)";
});

function _fmtTime(s){
  if(!isFinite(s))return"0:00";
  const m=Math.floor(s/60),sec=Math.floor(s%60);
  return`${m}:${sec.toString().padStart(2,"0")}`;
}

function _bindMediaEvents(el){
  _activeMedia=el;
  el.volume=parseFloat(HTML.ncMediaVolume.value);
  el.addEventListener("timeupdate",()=>{
    if(!el.duration)return;
    HTML.ncMediaSeek.value=(el.currentTime/el.duration)*100;
    HTML.ncMediaTime.textContent=`${_fmtTime(el.currentTime)} / ${_fmtTime(el.duration)}`;
  });
  el.addEventListener("ended",()=>{HTML.ncMediaStatus.textContent="⏹ Playback ended.";HTML.ncMediaStatus.className="nc-media-status";});
  el.addEventListener("error",()=>{HTML.ncMediaStatus.textContent="❌ Could not load media. Try a direct URL.";HTML.ncMediaStatus.className="nc-media-status err";});
  el.addEventListener("loadeddata",()=>{HTML.ncMediaStatus.textContent="✅ Ready — press ⏯ to play.";HTML.ncMediaStatus.className="nc-media-status ok";});
}

function _isYouTube(url){return/youtu\.be|youtube\.com/i.test(url);}
function _isAudio(url){return/\.(mp3|ogg|wav|flac|aac|m4a|opus)(\?|$)/i.test(url);}

function _getYouTubeVideoId(url){
  let id;
  if(url.includes('youtu.be/'))id=url.split('youtu.be/')[1].split(/[?&#]/)[0];
  else if(url.includes('watch?v='))id=url.split('watch?v=')[1].split('&')[0];
  else if(url.includes('/embed/'))id=url.split('/embed/')[1].split(/[?&#]/)[0];
  return id||null;
}

function loadMedia(url){
  url=url.trim();
  if(!url){showToast("⚠️ Enter a URL first",true);return;}
  if(_activeMedia){_activeMedia.pause();_activeMedia.src="";}
  HTML.ncMediaPlayer.classList.remove("visible");
  HTML.ncMediaAudio.classList.remove("visible");
  HTML.ncMediaTime.textContent="0:00 / 0:00";
  HTML.ncMediaSeek.value=0;

  if(_isYouTube(url)){
    const vidId=_getYouTubeVideoId(url);
    if(vidId){
      let iframe=document.getElementById('ncYouTubeFrame');
      if(!iframe){
        iframe=document.createElement('iframe');
        iframe.id='ncYouTubeFrame';
        iframe.style.width='100%';
        iframe.style.height='360px';
        iframe.style.borderRadius='6px';
        iframe.style.border='1px solid var(--dc-border-subtle)';
        iframe.style.marginBottom='10px';
        iframe.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';
        iframe.allowFullscreen=true;
        HTML.ncMediaPanel.insertBefore(iframe,HTML.ncMediaUrl.parentElement.nextElementSibling);
      }
      iframe.src=`https://www.youtube-nocookie.com/embed/${vidId}?autoplay=0&rel=0`;
      HTML.ncMediaStatus.textContent="✅ YouTube video loaded!";
      HTML.ncMediaStatus.className="nc-media-status ok";
      _activeMedia=null;
      return;
    }
  }

  if(_isAudio(url)){
    HTML.ncMediaAudio.src=url;
    HTML.ncMediaAudio.classList.add("visible");
    _bindMediaEvents(HTML.ncMediaAudio);
    HTML.ncMediaStatus.textContent="⏳ Loading audio…";
    HTML.ncMediaStatus.className="nc-media-status";
    HTML.ncMediaAudio.load();
  } else {
    HTML.ncMediaPlayer.src=url;
    HTML.ncMediaPlayer.classList.add("visible");
    _bindMediaEvents(HTML.ncMediaPlayer);
    HTML.ncMediaStatus.textContent="⏳ Loading video…";
    HTML.ncMediaStatus.className="nc-media-status";
    HTML.ncMediaPlayer.load();
  }
}

function handleMediaFileUpload(file){
  if(!file)return;
  const fname=file.name.toLowerCase();
  const isAudio=/\.(mp3|ogg|wav|flac|aac|m4a|opus)$/i.test(fname);
  const isVideo=/\.(mp4|webm|mkv|avi|mov)$/i.test(fname);
  if(!isAudio&&!isVideo){showToast("❌ Unsupported file. Use: MP3, OGG, WAV, MP4, WEBM, MKV",true);return;}
  
  const blobUrl=URL.createObjectURL(file);
  if(_activeMedia){_activeMedia.pause();_activeMedia.src="";}
  HTML.ncMediaPlayer.classList.remove("visible");
  HTML.ncMediaAudio.classList.remove("visible");
  HTML.ncMediaTime.textContent="0:00 / 0:00";
  HTML.ncMediaSeek.value=0;
  
  if(isAudio){
    HTML.ncMediaAudio.src=blobUrl;
    HTML.ncMediaAudio.classList.add("visible");
    _bindMediaEvents(HTML.ncMediaAudio);
    HTML.ncMediaStatus.textContent=`⏳ Loading: ${file.name}…`;
    HTML.ncMediaAudio.load();
  } else {
    HTML.ncMediaPlayer.src=blobUrl;
    HTML.ncMediaPlayer.classList.add("visible");
    _bindMediaEvents(HTML.ncMediaPlayer);
    HTML.ncMediaStatus.textContent=`⏳ Loading: ${file.name}…`;
    HTML.ncMediaPlayer.load();
  }
  HTML.ncMediaUrl.value=file.name;
}

HTML.ncMediaLoadBtn.addEventListener("click",()=>loadMedia(HTML.ncMediaUrl.value));
HTML.ncMediaUrl.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();loadMedia(HTML.ncMediaUrl.value);}});

const fileBtn=document.getElementById('ncMediaFileBtn');
const fileInput=document.getElementById('ncMediaFileInput');
if(fileBtn&&fileInput){
  fileBtn.addEventListener("click",()=>fileInput.click());
  fileInput.addEventListener("change",e=>{if(e.target.files[0])handleMediaFileUpload(e.target.files[0]);});
}

HTML.ncMediaPresets.querySelectorAll(".nc-media-preset-pill").forEach(pill=>{
  pill.addEventListener("click",()=>{
    const url=pill.dataset.url;
    HTML.ncMediaUrl.value=url;
    loadMedia(url);
  });
});

HTML.ncMediaPlayPause.addEventListener("click",()=>{
  if(!_activeMedia)return;
  if(_activeMedia.paused){_activeMedia.play().catch(()=>{});HTML.ncMediaStatus.textContent="▶ Playing…";HTML.ncMediaStatus.className="nc-media-status ok";}
  else{_activeMedia.pause();HTML.ncMediaStatus.textContent="⏸ Paused.";HTML.ncMediaStatus.className="nc-media-status";}
});

HTML.ncMediaStop.addEventListener("click",()=>{
  if(!_activeMedia)return;
  _activeMedia.pause();_activeMedia.currentTime=0;
  HTML.ncMediaSeek.value=0;
  HTML.ncMediaTime.textContent="0:00 / 0:00";
  HTML.ncMediaStatus.textContent="⏹ Stopped.";HTML.ncMediaStatus.className="nc-media-status";
});

HTML.ncMediaSeek.addEventListener("input",()=>{
  if(!_activeMedia||!_activeMedia.duration)return;
  _activeMedia.currentTime=(_activeMedia.duration*(parseFloat(HTML.ncMediaSeek.value)/100));
});

HTML.ncMediaVolume.addEventListener("input",()=>{
  const v=parseFloat(HTML.ncMediaVolume.value);
  if(_activeMedia)_activeMedia.volume=v;
});

// ─── AI ASSISTANT (local knowledge base — no API needed) ──────────────────────
(function(){

  // ── Knowledge base: each entry has keywords[] and an answer string ──
  const NC_KB=[
    {
      tags:['command','commands','prompt','cmd','list','all commands','what can','how to use'],
      answer:`**Command Prompt commands** (type in the bar at the bottom of the CMD panel):\n\n\`?spawn <hash> <count> [tank]\` — spawn bots into a room. Example: \`?spawn ca 50 tri-angle\`\n\`?kill\` — kill all bots immediately\n\`?tank <name>\` — switch all bots to a different tank. Example: \`?tank anni\`\n\`?feed on\` / \`?feed off\` — toggle bot feeding\n\`?mode rotate\` — bots orbit around you\n\`?mode stayput\` — bots stop moving\n\`?mode growth\` — bots move toward your world position\n\`?mode normal\` — bots follow your mouse (default)\n\`?list tanks\` — print all tank name aliases in the log\n\`?help\` — show the full reference in the log\n\nTip: ↑ / ↓ arrow keys browse your command history.`
    },
    {
      tags:['spawn','connect','bot','bots','how to spawn','connect bot','start bot','create bot','hash'],
      answer:`To spawn bots:\n\n1. Add a server (Local or Codespace) and connect it (green dot).\n2. Enter your game hash in the **Server Hash** field — it's the part of the arras.io URL after \`#\` (e.g. \`arras.io/#ca\` → hash is \`ca\`).\n3. Pick a tank from the **Tank** dropdown.\n4. Click **Connect 1** to spawn one bot, or set the count and click **Spawn Multi**.\n\nOr via command prompt: \`?spawn ca 50 tri-angle\``
    },
    {
      tags:['kill','delete','remove','stop bot','disconnect bot'],
      answer:`To kill all bots click the **Kill All Bots** button, or type \`?kill\` in the command prompt.\n\nTo disconnect a single server row, click the ✕ button on that row.`
    },
    {
      tags:['codespace','github','port','8082','setup','wss','url','convert','https'],
      answer:`**Codespace setup:**\n\n1. Open a GitHub Codespace and start your bot server on port 8082 (e.g. \`node server.js\`).\n2. In the Ports tab, right-click port 8082 → Port Visibility → **Public**. Private = error 1006.\n3. Hover over port 8082 → click the globe icon to copy the forwarded URL (looks like \`https://NAME-8082.preview.app.github.dev\`).\n4. Click **+ Codespace** in the script, paste that URL — it auto-converts \`https://\` → \`wss://\`.\n5. Click Connect. Green dot = ready.\n\nYou can also paste the URL in the Guide panel → it converts and adds the server automatically.`
    },
    {
      tags:['1006','red dot','error','not connecting','wont connect','port','private','abnormal'],
      answer:`**Error 1006 / red dot fix:**\n\nThis almost always means the Codespace port is set to **Private**.\n\nFix: GitHub Codespace → Ports tab → right-click 8082 → Port Visibility → **Public**.\n\nAlso check:\n- Your URL uses \`wss://\` not \`https://\` (the script converts automatically on paste)\n- Your bot server is actually running in the Codespace terminal\n- The Codespace hasn't timed out (yellow dot = URL changed, grab a new one from Ports tab)`
    },
    {
      tags:['yellow dot','timeout','url changed','reconnect','disconnected'],
      answer:`A yellow dot that never turns green usually means the **Codespace URL has changed** — this happens every time you restart a Codespace.\n\nFix: Codespace → Ports tab → copy the new forwarded URL for port 8082 → paste it into the server row input field → click Connect.`
    },
    {
      tags:['mode','modes','movement','rotate','stayput','stay put','growth','normal','follow mouse','auto rotate'],
      answer:`**Movement modes:**\n\n- **Normal** (default) — bots follow your mouse at 1/15 scale\n- **Auto Rotate** (↻ button) — bots orbit around you in a circle continuously\n- **Stay Put** (📍 button) — bots freeze in place\n- **Growth Mode** (🌱 button) — bots converge on your world position + mouse\n- **Active Mod** — overrides all of the above (mods take highest priority)\n\nYou can also switch via command: \`?mode rotate\`, \`?mode stayput\`, \`?mode growth\`, \`?mode normal\``
    },
    {
      tags:['mod','mods','builtin','built-in','repel','charge','jitter','orbit','spiral','mirror','movement mod'],
      answer:`**Built-in mods** (🧩 Mods panel, one active at a time):\n\n- **Repel** — bots flee from your cursor\n- **Charge** — bots rush hard toward your cursor (3× speed)\n- **Jitter** ⚡ — bots move randomly and erratically\n- **Orbit** 🌀 — bots smoothly orbit around you\n- **Spiral** 🎡 — bots spiral outward then reset\n- **Mirror** 🔁 — flips the horizontal movement axis\n\nClick a mod button to toggle it on/off. An active mod overrides all other movement modes.`
    },
    {
      tags:['custom mod','write mod','create mod','registermod','api','tick','make mod','own mod'],
      answer:`**Custom Mod API** — open the 🧩 Mods panel and paste your code:\n\n\`\`\`js\nregisterMod({\n  name: 'My Mod',\n  icon: '🎯',\n  description: 'What it does',\n  tick: (ctx) => ({\n    bx: ctx.mouseX * 2,\n    by: ctx.mouseY * 2\n  })\n});\n\`\`\`\n\n**ctx fields:** \`x\`, \`y\` (world coords), \`mouseX\`, \`mouseY\` (offset from screen centre), \`mouseDown\`, \`rMouseDown\`, \`keys\` ({ShiftLeft, …})\n\nReturn \`{ bx, by }\` to override movement. You can also upload a full \`.user.js\` file — the \`==UserScript==\` header is stripped automatically.`
    },
    {
      tags:['tank','tanks','alias','aliases','switch tank','change tank','triangle','annihilator','list tanks'],
      answer:`Use the **Tank** dropdown to pick a tank before spawning, or switch all live bots with \`?tank <name>\`.\n\nCommon aliases you can use anywhere:\n- \`tri\` / \`triangle\` → Triangle\n- \`anni\` / \`annihilator\` → Annihilator\n- \`rocket\` / \`ram\` → Rocket\n- \`shotgun\`, \`pursuer\`, \`engineer\` → exact names\n\nType \`?list tanks\` in the command prompt to print the full alias list.\n\nYou can also open the ✏️ Tank editor to view/edit the full tank const directly.`
    },
    {
      tags:['theme','color','colour','preset','discord','midnight','forest','catppuccin','rose gold','slate','skin','appearance'],
      answer:`Open the **🎨 Theme panel** (button in the title bar).\n\n**Built-in presets:** Discord, Midnight, Forest, Rose Gold, Slate, Catppuccin, ~AS Clan, ~AS Red\n\nClick a preset pill to apply it instantly. You can also click any colour swatch to customise individual colours.\n\nTo save your theme: type a name in the "Save as…" box → click Save. Saved themes appear below and persist in localStorage.\n\nTo share themes: use ⬇ Export to download a preset file, then ⬆ Import on another browser.`
    },
    {
      tags:['font','inter','ubuntu','comic sans','noto','text font'],
      answer:`Change the font inside the **🎨 Theme panel** → scroll to the **Font** row at the bottom.\n\nAvailable fonts: **Inter** (default), **Ubuntu**, **Comic Sans**, **Noto Sans**, **GG Sans** (Discord's font), **Whitney** (classic Discord-era font).\n\nThe choice is saved to localStorage and applies to all text in the menu.`
    },
    {
      tags:['export','import','backup','save settings','preset file','share settings'],
      answer:`Click **⬇ Export** in the title bar to download a \`.txt\` file containing your active theme, font, saved user themes, and saved server URLs.\n\nClick **⬆ Import** to load a previously exported file. It merges themes and servers without erasing existing ones.\n\nThis is the easiest way to share your setup or back it up.`
    },
    {
      tags:['compact','compact mode','small','mini','quick controls'],
      answer:`Click **⬛ Compact** in the title bar to switch to a smaller 380px panel with just the essential controls: server hash, tank select, Connect 1, Spawn Multi, Kill All, and Reconnect All.\n\nThe compact view stays in sync with the full view — changes in one reflect in the other. Click **⬛ Full View** to go back.`
    },
    {
      tags:['media','music','player','audio','video','youtube','mp3','song','lofi'],
      answer:`Click **🎵 Music** in the title bar to open the media player.\n\n- Paste a **direct audio/video URL** (mp3, ogg, wav, flac, aac, m4a, opus, or a video URL) and click ▶ Load.\n- **YouTube links** open in a new tab — CSP on arras.io prevents embedding.\n- Quick preset pills: lofi hip hop, lofi chill, phonk, synthwave.\n- Controls: ⏯ play/pause, ⏹ stop, seek slider, volume slider.`
    },
    {
      tags:['feed','feeding','toggle feed'],
      answer:`Tick the **Feed** checkbox to make bots shoot/feed continuously. Untick to stop.\n\nYou can also toggle it via command: \`?feed on\` or \`?feed off\`.`
    },
    {
      tags:['follow mouse','mouse','mbs','follow'],
      answer:`The **Follow mouse** checkbox (labelled "mbs") controls whether bots track your mouse position. It's ticked by default.\n\nUnticking it stops bots from receiving mouse movement — useful if you want them to hold a fixed position without using Stay Put mode.`
    },
    {
      tags:['local','localhost','local server','local bot'],
      answer:`Click **+ Local** to add a local server entry. It connects to \`ws://localhost:8082\` automatically — no URL needed.\n\nMake sure your local bot server is running on port 8082 before clicking Connect.`
    },
    {
      tags:['reconnect','reconnect all','lost connection'],
      answer:`Click **↺ Reconnect All** to close and reopen all server WebSocket connections at once. Useful if bots drop after a network hiccup.\n\nIn compact mode the same button is labelled ↺ Reconnect All.`
    },
    {
      tags:['keyboard','shortcut','escape','hotkey','key','toggle menu','hide menu'],
      answer:`**Keyboard shortcuts:**\n\n- **Escape** — toggle the menu open/closed\n- **↑ / ↓ arrow keys** in the command input — browse your command history`
    },
    {
      tags:['websocket','protocol','packet','handshake','msgpack','binary'],
      answer:`The script communicates with the bot server using **msgpack-encoded WebSocket messages**.\n\nPacket types:\n- \`"F"\` — spawn bots into a hash\n- \`"B"\` — kill all bots\n- \`"A"\` — movement broadcast (every 80ms): x, y, bx, by, mouseDown, rMouseDown, followMouse, feeding, ShiftLeft\n- \`"Z"\` — change tank\n- \`"M"\` / \`"C"\` — handshake (M sends 72011, C sends data[0] XOR 845)`
    },
    {
      tags:['bots not spawning','spawn not working','connect not working','nothing happens'],
      answer:`If bots connect (green dot) but won't spawn into the game:\n\n1. Check the **Server Hash** field — it must match the hash in your arras.io URL after \`#\`. E.g. \`arras.io/#ca\` → type \`ca\`.\n2. Make sure you're actually in an arras.io game room (not the menu screen).\n3. Try \`?spawn <hash> 1\` in the command prompt to test with one bot.\n4. If the dot isn't green, fix the connection first (see Codespace or Local setup).`
    },
  ];

  // ── Scorer: count keyword hits, return best matching entry ──
  function findAnswer(q){
    const norm=q.toLowerCase().replace(/[?!.,]/g,'');
    const words=norm.split(/\s+/);
    let best=null,bestScore=0;
    for(const entry of NC_KB){
      let score=0;
      for(const tag of entry.tags){
        if(norm.includes(tag))score+=tag.split(' ').length*2;
      }
      for(const w of words){
        for(const tag of entry.tags){
          if(tag.includes(w)&&w.length>2)score+=1;
        }
      }
      if(score>bestScore){bestScore=score;best=entry;}
    }
    if(bestScore===0)return null;
    return best;
  }

  function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function formatAiReply(text){
    return text
      .replace(/```[\w]*\n?([\s\S]*?)```/g,(_,c)=>`<pre>${escHtml(c.trim())}</pre>`)
      .replace(/`([^`\n]+)`/g,(_,c)=>`<code>${escHtml(c)}</code>`)
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\n/g,'<br>');
  }

  function addAiMsg(role,content){
    const div=document.createElement('div');
    div.className='nc-ai-msg '+role;
    if(role==='bot'){
      div.innerHTML='<span class="nc-ai-label">NC AI</span>'+formatAiReply(content);
    } else {
      div.textContent=content;
    }
    HTML.ncAiLog.appendChild(div);
    HTML.ncAiLog.scrollTop=HTML.ncAiLog.scrollHeight;
    return div;
  }

  function sendAiMsg(question){
    if(!question.trim())return;
    HTML.ncAiInput.value='';
    addAiMsg('user',question);
    const entry=findAnswer(question);
    if(entry){
      addAiMsg('bot',entry.answer);
    } else {
      addAiMsg('bot',"I don't have a specific answer for that. Try asking about: **commands**, **spawning bots**, **Codespace setup**, **movement modes**, **mods**, **tanks**, **themes**, **troubleshooting**, or **keyboard shortcuts**.");
    }
  }

  let aiOpen=false;

  HTML.ncAiBtn.addEventListener('click',()=>{
    aiOpen=!aiOpen;
    HTML.ncAiPanel.classList.toggle('open',aiOpen);
    HTML.ncAiBtn.style.color=aiOpen?'var(--dc-blurple-light)':'var(--dc-text-muted)';
    if(aiOpen&&HTML.ncAiLog.children.length===0){
      addAiMsg('bot',"Hey! I know Noob Controller v0.21 inside out. Ask me about commands, spawning bots, Codespace setup, mods, movement modes, tanks, themes, and more — or use the quick buttons below.");
    }
  });

  HTML.ncAiSendBtn.addEventListener('click',()=>sendAiMsg(HTML.ncAiInput.value.trim()));
  HTML.ncAiInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();sendAiMsg(HTML.ncAiInput.value.trim());}
  });
  HTML.ncAiChips.querySelectorAll('.nc-ai-chip').forEach(chip=>{
    chip.addEventListener('click',()=>sendAiMsg(chip.dataset.q));
  });
})();

// ─── LAYOUT EDITOR ────────────────────────────────────────────────────────────
(function(){
  const LAYOUT_SAVE_KEY='noobController_layout';

  // Define all draggable sections: id = the actual DOM element id to reorder, anchor = its parent container
  const SECTIONS=[
    {id:'ncGuidePanel',    icon:'📡', name:'Codespace Guide',  anchor:'ncFullView'},
    {id:'ncHelpPanel',     icon:'❓', name:'Help / Commands',  anchor:'ncFullView'},
    {id:'ncModsPanel',     icon:'🧩', name:'Mods',            anchor:'ncFullView'},
    {id:'ncThemePanel',    icon:'🎨', name:'Themes',           anchor:'ncFullView'},
    {id:'ncLayoutPanel',   icon:'🔲', name:'Layout Editor',    anchor:'ncFullView'},
    {id:'ncAiPanel',       icon:'🤖', name:'AI Assistant',     anchor:'ncFullView'},
    {id:'ncMediaPanel',    icon:'🎵', name:'Media Player',     anchor:'ncFullView'},
    {id:'ncCmdPanel',      icon:'⌨', name:'Command Prompt',   anchor:'ncFullView'},
    {id:'ncTanksPanel',    icon:'✏️', name:'Tank Editor',      anchor:'ncFullView'},
    {id:'_servers',        icon:'🖥', name:'Servers Section',  anchor:'ncFullView'},
    {id:'_botcontrols',    icon:'🤖', name:'Bot Controls',     anchor:'ncFullView'},
  ];

  // Load saved layout from localStorage
  function loadLayout(){
    try{return JSON.parse(localStorage.getItem(LAYOUT_SAVE_KEY))||{};}catch{return{};}
  }
  function saveLayout(data){
    localStorage.setItem(LAYOUT_SAVE_KEY,JSON.stringify(data));
  }

  let layoutData=loadLayout();
  // order: array of section ids in display order
  // hidden: set of hidden section ids
  // width: menu width px
  // opacity: 0-100
  let sectionOrder=layoutData.order||SECTIONS.map(s=>s.id);
  let hiddenSections=new Set(layoutData.hidden||[]);
  let menuWidth=layoutData.width||600;
  let menuOpacity=layoutData.opacity!=null?layoutData.opacity:100;

  // Make sure any new sections not in saved order get appended
  SECTIONS.forEach(s=>{if(!sectionOrder.includes(s.id))sectionOrder.push(s.id);});

  // Apply width + opacity immediately on load
  function applyMenuStyle(){
    menu.style.width=menuWidth+'px';
    menu.style.opacity=(menuOpacity/100).toFixed(2);
  }
  applyMenuStyle();

  // Apply section order + visibility to the DOM
  function applyLayout(){
    const fullView=document.getElementById('ncFullView');
    if(!fullView)return;
    // Resolve real DOM nodes for each section id
    function getNode(id){
      if(id==='_servers'){
        // The servers block is multiple elements — wrap in a sentinel
        return document.querySelector('#ncFullView>p:has(#addLocal)')||
               document.getElementById('addLocal')?.closest('p')||null;
      }
      if(id==='_botcontrols'){
        return document.getElementById('connectNoob')?.closest('p')||null;
      }
      return document.getElementById(id);
    }

    // Reorder panels by appending in sectionOrder sequence
    sectionOrder.forEach(id=>{
      const node=getNode(id);
      if(node&&node.parentElement===fullView){
        fullView.appendChild(node);
        // For _servers also move the collapsible div
        if(id==='_servers'){
          const sc=document.getElementById('serversCollapsible');
          const hr=sc?.nextElementSibling;
          if(sc)fullView.appendChild(sc);
          if(hr&&hr.tagName==='HR')fullView.appendChild(hr);
        }
        // For _botcontrols move all the mode/kill buttons after it
        if(id==='_botcontrols'){
          ['autoRotateBtn','stayPutBtn','growthModeBtn','deleteNoobs'].forEach(bid=>{
            const bp=document.getElementById(bid)?.closest('p');
            if(bp&&bp.parentElement===fullView)fullView.appendChild(bp);
          });
          const ar=document.getElementById('autoRotateTimer');
          if(ar&&ar.parentElement===fullView)fullView.appendChild(ar);
        }
      }
    });

    // Show/hide
    SECTIONS.forEach(s=>{
      const node=getNode(s.id);
      if(!node)return;
      const hide=hiddenSections.has(s.id);
      // Don't hide the layout panel itself while it's open
      if(s.id==='ncLayoutPanel'&&HTML.ncLayoutPanel.classList.contains('open'))return;
      node.style.setProperty('display',hide?'none':'','important');
      if(s.id==='_servers'){
        const sc=document.getElementById('serversCollapsible');
        if(sc)sc.style.setProperty('display',hide?'none':'','important');
      }
    });
  }

  // Build the drag-and-drop list UI
  let dragSrc=null;
  function buildLayoutList(){
    HTML.ncLayoutList.innerHTML='';
    sectionOrder.forEach(id=>{
      const sec=SECTIONS.find(s=>s.id===id);
      if(!sec)return;
      const item=document.createElement('div');
      item.className='nc-layout-item';
      item.dataset.id=id;
      item.draggable=true;
      const isHidden=hiddenSections.has(id);
      item.innerHTML=`<span class="nc-layout-handle">⠿</span><span class="nc-layout-icon">${sec.icon}</span><span class="nc-layout-name">${sec.name}</span><button class="nc-layout-toggle${isHidden?' hidden-section':''}">${isHidden?'Hidden':'Visible'}</button>`;
      // Toggle visibility
      item.querySelector('.nc-layout-toggle').addEventListener('click',e=>{
        e.stopPropagation();
        if(hiddenSections.has(id)){hiddenSections.delete(id);}else{hiddenSections.add(id);}
        buildLayoutList();
        applyLayout();
      });
      // Drag events
      item.addEventListener('dragstart',e=>{
        dragSrc=item;
        setTimeout(()=>item.classList.add('dragging'),0);
        e.dataTransfer.effectAllowed='move';
      });
      item.addEventListener('dragend',()=>{
        item.classList.remove('dragging');
        HTML.ncLayoutList.querySelectorAll('.nc-layout-item').forEach(i=>i.classList.remove('drag-over'));
        dragSrc=null;
      });
      item.addEventListener('dragover',e=>{
        e.preventDefault();
        if(dragSrc&&dragSrc!==item){
          HTML.ncLayoutList.querySelectorAll('.nc-layout-item').forEach(i=>i.classList.remove('drag-over'));
          item.classList.add('drag-over');
        }
      });
      item.addEventListener('drop',e=>{
        e.preventDefault();
        if(!dragSrc||dragSrc===item)return;
        item.classList.remove('drag-over');
        const srcId=dragSrc.dataset.id;
        const dstId=item.dataset.id;
        const si=sectionOrder.indexOf(srcId);
        const di=sectionOrder.indexOf(dstId);
        if(si<0||di<0)return;
        sectionOrder.splice(si,1);
        sectionOrder.splice(di,0,srcId);
        buildLayoutList();
        applyLayout();
      });
      HTML.ncLayoutList.appendChild(item);
    });
  }

  // Width slider
  HTML.ncLayoutWidthSlider.value=menuWidth;
  HTML.ncLayoutWidthVal.textContent=menuWidth+'px';
  HTML.ncLayoutWidthSlider.addEventListener('input',()=>{
    menuWidth=parseInt(HTML.ncLayoutWidthSlider.value);
    HTML.ncLayoutWidthVal.textContent=menuWidth+'px';
    menu.style.width=menuWidth+'px';
  });

  // Opacity slider
  HTML.ncLayoutOpacitySlider.value=menuOpacity;
  HTML.ncLayoutOpacityVal.textContent=menuOpacity+'%';
  HTML.ncLayoutOpacitySlider.addEventListener('input',()=>{
    menuOpacity=parseInt(HTML.ncLayoutOpacitySlider.value);
    HTML.ncLayoutOpacityVal.textContent=menuOpacity+'%';
    menu.style.opacity=(menuOpacity/100).toFixed(2);
  });

  // Save button
  HTML.ncLayoutSaveBtn.addEventListener('click',()=>{
    saveLayout({order:sectionOrder,hidden:[...hiddenSections],width:menuWidth,opacity:menuOpacity});
    showToast('✅ Layout saved!');
  });

  // Reset button
  HTML.ncLayoutResetBtn.addEventListener('click',()=>{
    sectionOrder=SECTIONS.map(s=>s.id);
    hiddenSections=new Set();
    menuWidth=600;menuOpacity=100;
    HTML.ncLayoutWidthSlider.value=600;
    HTML.ncLayoutWidthVal.textContent='600px';
    HTML.ncLayoutOpacitySlider.value=100;
    HTML.ncLayoutOpacityVal.textContent='100%';
    menu.style.width='600px';
    menu.style.opacity='1';
    saveLayout({order:sectionOrder,hidden:[],width:600,opacity:100});
    buildLayoutList();
    applyLayout();
    showToast('✅ Layout reset to default');
  });

  // Toggle panel open/close
  let layoutOpen=false;
  HTML.ncLayoutBtn.addEventListener('click',()=>{
    layoutOpen=!layoutOpen;
    HTML.ncLayoutPanel.classList.toggle('open',layoutOpen);
    HTML.ncLayoutBtn.style.color=layoutOpen?'var(--dc-blurple-light)':'var(--dc-text-muted)';
    if(layoutOpen)buildLayoutList();
  });

  // Apply saved layout on load
  applyLayout();
})();