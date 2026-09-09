const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BnynbPta.js","assets/vendor-ionic-9WeBfP2y.js","assets/useIonicNavigation-Dz5pJjxx.js","assets/vendor-react-DM8q1VyT.js","assets/auth-store-88gzQI9Y.js","assets/SupabaseAuthService-ZUJflQrW.js","assets/vendor-zustand-BVIKIJTS.js","assets/useTheme-Bsg9-zFb.js","assets/explore-DHbOrmzN.js","assets/repository-CzI88KRG.js","assets/progress-BAD_7fuO.js","assets/i18n-service-C6vdMWdq.js","assets/settings-C0ehBsOf.js","assets/login-B6VT1hfd.js","assets/signup-1n9vDy-x.js","assets/splash-DZX5kgP_.js","assets/_not-found-DyQlMnd5.js"])))=>i.map(i=>d[i]);
import{b as q,c as U,r as p,I as K,a as j,d as J,e as P,_ as v,f as G,g as Q}from"./vendor-ionic-9WeBfP2y.js";import{B as Y,R as X,a as b,N as Z}from"./vendor-react-DM8q1VyT.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&t(n)}).observe(document,{childList:!0,subtree:!0});function s(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(r){if(r.ep)return;r.ep=!0;const a=s(r);fetch(r.href,a)}})();var R={exports:{}},E={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var _;function ee(){if(_)return E;_=1;var e=q(),o=Symbol.for("react.element"),s=Symbol.for("react.fragment"),t=Object.prototype.hasOwnProperty,r=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,a={key:!0,ref:!0,__self:!0,__source:!0};function n(l,i,d){var f,g={},m=null,h=null;d!==void 0&&(m=""+d),i.key!==void 0&&(m=""+i.key),i.ref!==void 0&&(h=i.ref);for(f in i)t.call(i,f)&&!a.hasOwnProperty(f)&&(g[f]=i[f]);if(l&&l.defaultProps)for(f in i=l.defaultProps,i)g[f]===void 0&&(g[f]=i[f]);return{$$typeof:o,type:l,key:m,ref:h,props:g,_owner:r.current}}return E.Fragment=s,E.jsx=n,E.jsxs=n,E}var T;function te(){return T||(T=1,R.exports=ee()),R.exports}var c=te(),k={},O;function re(){if(O)return k;O=1;var e=U();return k.createRoot=e.createRoot,k.hydrateRoot=e.hydrateRoot,k}var oe=re();const Pe={create(e){const o={};for(const[s,t]of Object.entries(e))o[s]=u(t);return o}};function u(e){const o={},s=n=>{if(n!==void 0)return typeof n=="number"?`${n}px`:n},t=(n,l,i,d=!1)=>{const f=e[n];f!==void 0&&(o[i]=d?s(f):f)};t("flex","flex","flex"),t("flexDirection","flexDirection","flexDirection"),t("justifyContent","justifyContent","justifyContent"),t("alignItems","alignItems","alignItems"),t("alignSelf","alignSelf","alignSelf"),t("alignContent","alignContent","alignContent"),t("gap","gap","gap",!0),t("position","position","position"),t("top","top","top",!0),t("right","right","right",!0),t("bottom","bottom","bottom",!0),t("left","left","left",!0),t("overflow","overflow","overflow"),t("zIndex","zIndex","zIndex",!0),t("width","width","width",!0),t("height","height","height",!0),t("minWidth","minWidth","minWidth",!0),t("minHeight","minHeight","minHeight",!0),t("maxWidth","maxWidth","maxWidth",!0),t("maxHeight","maxHeight","maxHeight",!0),t("margin","margin","margin",!0),t("marginTop","marginTop","marginTop",!0),t("marginRight","marginRight","marginRight",!0),t("marginBottom","marginBottom","marginBottom",!0),t("marginLeft","marginLeft","marginLeft",!0),t("padding","padding","padding",!0),t("paddingTop","paddingTop","paddingTop",!0),t("paddingRight","paddingRight","paddingRight",!0),t("paddingBottom","paddingBottom","paddingBottom",!0),t("paddingLeft","paddingLeft","paddingLeft",!0),t("borderWidth","borderWidth","borderWidth",!0),t("borderTopWidth","borderTopWidth","borderTopWidth",!0),t("borderRightWidth","borderRightWidth","borderRightWidth",!0),t("borderBottomWidth","borderBottomWidth","borderBottomWidth",!0),t("borderLeftWidth","borderLeftWidth","borderLeftWidth",!0),t("borderColor","borderColor","borderColor"),t("borderTopColor","borderTopColor","borderTopColor"),t("borderRightColor","borderRightColor","borderRightColor"),t("borderBottomColor","borderBottomColor","borderBottomColor"),t("borderLeftColor","borderLeftColor","borderLeftColor"),t("borderStyle","borderStyle","borderStyle"),t("borderRadius","borderRadius","borderRadius",!0),t("backgroundColor","backgroundColor","backgroundColor"),t("opacity","opacity","opacity",!0);const r=e;"fontSize"in r&&r.fontSize!==void 0&&(o.fontSize=`${r.fontSize}px`),"fontWeight"in r&&r.fontWeight!==void 0&&(o.fontWeight=r.fontWeight),"fontStyle"in r&&r.fontStyle!==void 0&&(o.fontStyle=r.fontStyle),"fontFamily"in r&&r.fontFamily!==void 0&&(o.fontFamily=r.fontFamily),"lineHeight"in r&&r.lineHeight!==void 0&&(o.lineHeight=`${r.lineHeight}px`),"letterSpacing"in r&&r.letterSpacing!==void 0&&(o.letterSpacing=`${r.letterSpacing}px`),"color"in r&&r.color!==void 0&&(o.color=r.color),"textAlign"in r&&r.textAlign!==void 0&&(o.textAlign=r.textAlign),"textTransform"in r&&r.textTransform!==void 0&&(o.textTransform=r.textTransform),"textDecorationLine"in r&&r.textDecorationLine!==void 0&&(o.textDecorationLine=r.textDecorationLine),"textDecorationColor"in r&&r.textDecorationColor!==void 0&&(o.textDecorationColor=r.textDecorationColor),"numberOfLines"in r&&r.numberOfLines!==void 0&&(o.webkitLineClamp=r.numberOfLines,o.webkitBoxOrient="vertical",o.overflow="hidden");const a=e;if(a.shadowColor||a.shadowOffset||a.shadowOpacity!==void 0||a.elevation!==void 0){a.shadowColor;const n=a.shadowOffset||{width:0,height:1},l=a.shadowOpacity??.05,i=a.shadowRadius??2,d=a.elevation??0;o.boxShadow=`${n.width}px ${n.height}px ${i}px rgba(0,0,0,${l})`,d>0&&(o.boxShadow=`0 ${d}px ${d*2}px rgba(0,0,0,0.1)`)}return o}const ie=p.forwardRef(({style:e,className:o,children:s,testID:t,accessible:r,accessibilityLabel:a,role:n,...l},i)=>{const{colors:d}=useTheme(),f=Array.isArray(e)?e.map(g=>u(g)):u(e);return c.jsx("div",{ref:i,className:o,"data-testid":t,style:[f,{color:d.textPrimary}],role:n||"presentation",...l,children:s})});ie.displayName="View";const ae=p.forwardRef(({style:e,className:o,children:s,testID:t,numberOfLines:r,ellipsizeMode:a,color:n,...l},i)=>{const{colors:d,typ:f}=useTheme(),g=Array.isArray(e)?e.map(h=>u(h)):u(e),m={...g,color:g.color||n||d.textPrimary};return c.jsx("span",{ref:i,className:o,"data-testid":t,style:m,...l,children:s})});ae.displayName="Text";const ne=p.forwardRef(({style:e,className:o,onPress:s,onPressIn:t,onPressOut:r,onLongPress:a,disabled:n=!1,activeOpacity:l=.7,testID:i,accessible:d,accessibilityRole:f,accessibilityState:g,children:m,...h},x)=>{const y=Array.isArray(e)?e.map(S=>u(S)):u(e),B=p.useCallback(()=>{n||s?.()},[n,s]),L=p.useCallback(()=>{t?.()},[t]),w=p.useCallback(()=>{r?.()},[r]);return c.jsx("button",{ref:x,className:o,"data-testid":i,disabled:n,style:[y,{cursor:n?"not-allowed":"pointer",opacity:n?.5:l===1?1:void 0,border:"none",background:"transparent",padding:0,margin:0,...n?{}:{transition:"opacity 0.15s ease"}}],onClick:B,onMouseDown:L,onMouseUp:w,onMouseLeave:w,"aria-disabled":n,"aria-pressed":g?.selected,role:f||"button",...h,children:m})});ne.displayName="TouchableOpacity";const Me=({size:e="small",color:o,animating:s=!0,testID:t,...r})=>{const{colors:a}=useTheme(),n=o||a.primary,i=typeof e=="number"?e:{small:28,large:48}[e]??28;return s?c.jsx("div",{"data-testid":t,style:{display:"flex",alignItems:"center",justifyContent:"center",width:i,height:i,...r},children:c.jsx(J,{name:"circles",color:n,style:{width:i,height:i},"aria-label":"Loading"})}):null},se=p.forwardRef(({style:e,className:o,children:s,testID:t,showsHorizontalScrollIndicator:r,showsVerticalScrollIndicator:a,scrollEventThrottle:n,onScroll:l,contentContainerStyle:i,bounces:d,directionalLockEnabled:f,horizontal:g,pagingEnabled:m,refreshControl:h,onRefresh:x,refreshing:y,nestedScrollEnabled:B,keyboardShouldPersistTaps:L,...w},S)=>{const V=Array.isArray(e)?e.map(C=>u(C)):u(e),$=i?Array.isArray(i)?i.map(C=>u(C)):u(i):void 0;return c.jsxs(K,{ref:S,className:o,"data-testid":t,style:V,contentClassName:$,scrollEvents:!!l,onIonScroll:l,overflowHidden:!a,...w,children:[h,s]})});se.displayName="ScrollView";const de=j.forwardRef(({source:e,src:o,alt:s,style:t,className:r,testID:a,resizeMode:n,onLoad:l,onError:i,...d},f)=>{const g=Array.isArray(t)?t.map(x=>u(x)):u(t),m=e?.uri||o,h={...g,objectFit:n==="cover"?"cover":n==="contain"?"contain":"stretch"};return c.jsx("img",{ref:f,src:m,alt:s||"",className:r,"data-testid":a,style:h,onLoad:l,onError:i,...d})});de.displayName="Image";const le=p.forwardRef(({style:e,className:o,children:s,testID:t,edges:r={top:!0,bottom:!0},...a},n)=>{const l=Array.isArray(e)?e.map(d=>u(d)):u(e),i={...r.top?{paddingTop:"env(safe-area-inset-top, 0px)"}:{},...r.bottom?{paddingBottom:"env(safe-area-inset-bottom, 0px)"}:{},...r.left?{paddingLeft:"env(safe-area-inset-left, 0px)"}:{},...r.right?{paddingRight:"env(safe-area-inset-right, 0px)"}:{}};return c.jsx("div",{ref:n,className:o,"data-testid":t,style:{...l,...i},...a,children:s})});le.displayName="SafeAreaView";const We=({visible:e=!1,animationType:o="fade",onRequestClose:s,onShow:t,transparent:r,style:a,children:n,testID:l,...i})=>{const d=Array.isArray(a)?a.map(f=>u(f)):u(a);return c.jsx(P,{isOpen:e,animation:o==="slide"?"ion-slide":o==="fade"?"ion-fade":void 0,onDidDismiss:s,onDidPresent:t,style:d,"data-testid":l,...i,children:n})},ce=p.forwardRef(({style:e,className:o,children:s,testID:t,behavior:r="padding",keyboardVerticalOffset:a=0,...n},l)=>{const i=Array.isArray(e)?e.map(f=>u(f)):u(e),d=r==="padding"?a:0;return c.jsx("div",{ref:l,className:o,"data-testid":t,style:{...i,paddingBottom:d},...n,children:s})});ce.displayName="KeyboardAvoidingView";const Ie=({title:e,message:o,buttons:s,onDidDismiss:t,...r})=>((s||[]).map(a=>({text:a.text,role:a.cssClass?.includes("destructive")?"destructive":"cancel",handler:a.handler})),c.jsx(P,{isOpen:!1,initialBreakpoint:0,breakpoints:[0],children:c.jsx("div",{style:{display:"none"},"data-testid":"alert-placeholder"})})),fe=p.forwardRef(({href:e,onPress:o,style:s,className:t,children:r,testID:a,...n},l)=>{const i=Array.isArray(s)?s.map(d=>u(d)):u(s);return c.jsx("a",{ref:l,href:e,className:t,"data-testid":a,style:{...i,cursor:"pointer"},onClick:d=>{e||(d.preventDefault(),o?.())},...n,children:r})});fe.displayName="Link";function ze({data:e=[],renderItem:o,keyExtractor:s,style:t,className:r,testID:a,horizontal:n,ListHeaderComponent:l,ListFooterComponent:i,ListEmptyComponent:d,onEndReached:f,...g}){const m=Array.isArray(t)?t.map(x=>u(x)):u(t),h=e.map((x,y)=>s?.(x,y)??String(y));return c.jsxs("div",{className:r,"data-testid":a,style:m,...g,children:[l,e.length===0&&d,e.map((x,y)=>c.jsx("div",{style:n?{display:"inline-block",flexShrink:0}:void 0,children:o?.({item:x,index:y,separators:{}})},h[y])),i]})}const ue=p.forwardRef(({style:e,onPress:o,onPressIn:s,onPressOut:t,onLongPress:r,testID:a,children:n,...l},i)=>{const d=Array.isArray(e)?e.map(f=>u(f)):u(e);return c.jsx("div",{ref:i,"data-testid":a,style:d,onClick:o,onMouseDown:s,onMouseUp:t,onMouseLeave:t,onContextMenu:f=>{f.preventDefault(),r?.()},...l,children:n})});ue.displayName="TouchableWithoutFeedback";const pe=p.forwardRef(({style:e,onPress:o,testID:s,children:t,...r},a)=>{const n=Array.isArray(e)?e.map(l=>u(l)):u(e);return c.jsx("button",{ref:a,"data-testid":s,style:{...n,border:"none",background:"transparent",cursor:"pointer",padding:0},onClick:o,...r,children:t})});pe.displayName="TouchableNativeFeedback";const ge=p.forwardRef(({style:e,onPress:o,onPressIn:s,onPressOut:t,onLongPress:r,delayPressIn:a,delayPressOut:n,disabled:l=!1,testID:i,children:d,...f},g)=>{const m=typeof e=="function"?e({pressed:!1}):e,h=Array.isArray(m)?m.map(x=>u(x)):u(m);return c.jsx("button",{ref:g,className:i?`pressable-${i}`:void 0,"data-testid":i,disabled:l,style:[h,{cursor:l?"not-allowed":"pointer",border:"none",background:"transparent",padding:0}],onClick:o,onMouseDown:s,onMouseUp:t,onMouseLeave:t,...f,children:d})});ge.displayName="Pressable";const F={OS:"web",select:e=>e.web},He={dismiss:()=>{document.activeElement instanceof HTMLElement&&document.activeElement.blur()},addListener:(e,o)=>()=>{},removeListener:(e,o)=>{},isEventWithinHapticRegion:()=>!0},Ne={value:e=>({value:e}),timing:(e,o)=>({start:s=>s()}),spring:(e,o)=>({start:s=>s()}),delay:(e,o)=>o,sequence:e=>({start:o=>{for(const s of e)s.start&&s.start();o()}})},Ve={linear:()=>e=>e,ease:()=>e=>e*(2-e),quad:()=>e=>e*e,cubic:()=>e=>e*e*e},me=j.forwardRef(({style:e,placeholder:o,placeholderTextColor:s,multiline:t=!1,numberOfLines:r,value:a,onChangeText:n,...l},i)=>{const{colors:d}=useAppTheme();return c.jsx("textarea",{ref:i,placeholder:o,style:[{width:"100%",minHeight:t?100:44,padding:12,borderRadius:12,fontSize:16,color:d.textPrimary,backgroundColor:d.surface,border:`1px solid ${d.border}`,fontFamily:"inherit",resize:"none"},...Array.isArray(e)?e:[e]],value:a,onChange:f=>n?.(f.target.value),...l})});me.displayName="TextInput";const D={primary:"#E91E8C",primaryLight:"#FFB6CC",primaryDark:"#B30069",background:"#fcf9f8",backgroundDark:"#121212",surface:"#FFFFFF",surfaceDark:"#1E1E1E",surfaceElevated:"#FFFFFF",surfaceElevatedDark:"#2A2A2A",surfaceTint:"#FFF0F6",surfaceTintDark:"#2A1A24",border:"#FFE4EE",borderDark:"rgba(255, 255, 255, 0.08)",divider:"#FFF0F6",dividerDark:"rgba(255, 255, 255, 0.06)",textPrimary:"#2D2D2D",textSecondary:"#594048",textTertiary:"#6E6E6E",textMuted:"#A0A0A0",textPlaceholder:"#C0C0C0",textPrimaryDark:"#FFFFFF",textSecondaryDark:"#B3B3B3",textTertiaryDark:"#6E6E6E",textMutedDark:"#535353",success:"#008733",successLight:"#E8F5E9",successDark:"#1DB954",error:"#FF6B6B",errorLight:"#FFEBEE",errorDark:"#E51332",warning:"#FF9500",warningLight:"#FFF3E0",warningDark:"#FFB800",info:"#007AFF",infoLight:"#E3F2FD",infoDark:"#2196F3",statusNew:"#A0A0A0",statusReview:"#E91E8C",statusLearned:"#008733",iconBgRose:"#FFE4EE",iconBgPink:"#FFF0F6",iconBgPurple:"#EADCE2",iconBgBlue:"#E3F2FD",iconBgGreen:"#E8F5E9",iconBgOrange:"#FFF3E0",iconBgTeal:"#E0F2F1",iconBgIndigo:"#E8EAF6"},he={displayLarge:32,displayLargeMobile:28,headlineMedium:24,headlineSmall:20,titleLarge:18,titleMedium:16,titleSmall:14,bodyLarge:16,bodyMedium:14,bodySmall:12,labelLarge:14,labelMedium:12,labelSmall:11,buttonText:16,bibleText:20},xe={displayLarge:"700",displayLargeMobile:"700",headlineMedium:"700",headlineSmall:"600",titleLarge:"700",titleMedium:"600",titleSmall:"600",bodyLarge:"400",bodyMedium:"400",bodySmall:"400",labelLarge:"600",labelMedium:"600",labelSmall:"500",buttonText:"600",bibleText:"400"},ye={primary:"Roboto",heading:"Roboto",mono:"Courier New",bible:"Source Serif 4"},A={primary:"#E91E8C",primaryLight:"#FFB6CC",primaryDark:"#FF6BAC",background:"#121212",backgroundDark:"#0A0A0A",surface:"#1E1E1E",surfaceDark:"#151515",surfaceElevated:"#2A2A2A",surfaceElevatedDark:"#333333",surfaceTint:"#2A1A24",surfaceTintDark:"#1F151D",border:"rgba(255, 255, 255, 0.08)",borderDark:"rgba(255, 255, 255, 0.05)",divider:"rgba(255, 255, 255, 0.06)",dividerDark:"rgba(255, 255, 255, 0.04)",textPrimary:"#FFFFFF",textSecondary:"#B3B3B3",textTertiary:"#6E6E6E",textMuted:"#535353",textPlaceholder:"#404040",textPrimaryDark:"#2D2D2D",textSecondaryDark:"#594048",textTertiaryDark:"#6E6E6E",textMutedDark:"#A0A0A0",success:"#00C853",successLight:"#1A2E1A",successDark:"#1DB954",error:"#FF5252",errorLight:"#2E1A1A",errorDark:"#E51332",warning:"#FFB300",warningLight:"#2E2010",warningDark:"#FFB800",info:"#448AFF",infoLight:"#1A2030",infoDark:"#2196F3",statusNew:"#6E6E6E",statusReview:"#E91E8C",statusLearned:"#00C853",iconBgRose:"#2A1A24",iconBgPink:"#2A1A24",iconBgPurple:"#1F1520",iconBgBlue:"#1A2030",iconBgGreen:"#1A2E1A",iconBgOrange:"#2E2010",iconBgTeal:"#1A2E2E",iconBgIndigo:"#1A1A2E"},M={sizes:he,weights:xe,families:ye,displayLarge:{fontSize:32,fontWeight:"700",lineHeight:40},displayLargeMobile:{fontSize:28,fontWeight:"700",lineHeight:36},headlineMedium:{fontSize:24,fontWeight:"700",lineHeight:32},headlineSmall:{fontSize:20,fontWeight:"600",lineHeight:28},titleLarge:{fontSize:18,fontWeight:"700",lineHeight:24},titleMedium:{fontSize:16,fontWeight:"600",lineHeight:22},titleSmall:{fontSize:14,fontWeight:"600",lineHeight:20},bodyLarge:{fontSize:16,fontWeight:"400",lineHeight:24},bodyMedium:{fontSize:14,fontWeight:"400",lineHeight:20},bodySmall:{fontSize:12,fontWeight:"400",lineHeight:18},labelLarge:{fontSize:14,fontWeight:"600",lineHeight:18},labelMedium:{fontSize:12,fontWeight:"600",lineHeight:16,letterSpacing:.5},labelSmall:{fontSize:11,fontWeight:"500",lineHeight:15,letterSpacing:.05},buttonText:{fontSize:16,fontWeight:"600",lineHeight:24},bibleText:{fontSize:20,fontWeight:"400",lineHeight:34,letterSpacing:.01}},W={unit:8,xs:4,sm:8,md:16,lg:24,xl:32,"2xl":48,"3xl":64,containerMargin:24,gutter:16,stackSm:8,stackMd:16,stackLg:32,sectionGap:48},I={sm:8,md:12,lg:16,xl:20,"2xl":24,"3xl":32,full:9999,pill:26},z={sm:F.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:.03,shadowRadius:2},android:{elevation:1}}),md:F.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.05,shadowRadius:4},android:{elevation:2}}),lg:F.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:8},android:{elevation:4}}),xl:F.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:8},shadowOpacity:.1,shadowRadius:16},android:{elevation:8}}),rose:F.select({ios:{shadowColor:"#E91E8C",shadowOffset:{width:0,height:4},shadowOpacity:.3,shadowRadius:12},android:{elevation:6}}),modal:F.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:-4},shadowOpacity:.1,shadowRadius:12},android:{elevation:8}})},H={tabBarHeight:64,tabBarActiveHeight:64,headerHeight:56,safeAreaBottom:16};function be(e){return e==="dark"?A:D}const ve=p.createContext({colors:D,colorsDark:A,isDark:!1,themeMode:"light",typ:M,sp:W,rad:I,sh:z,nav:H});function Fe(){const e=document.documentElement.getAttribute("data-theme");return e==="dark"||e==="light"?e:window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function Ee({children:e}){const[o,s]=p.useState(Fe==="dark"),t=o?"dark":"light";p.useEffect(()=>{r(o);const l=window.matchMedia("(prefers-color-scheme: dark)"),i=d=>{s(d.matches),r(d.matches)};return l.addEventListener("change",i),()=>l.removeEventListener("change",i)},[]);function r(l){const i=document.documentElement,d=l?A:D;i.setAttribute("data-theme",l?"dark":"light"),i.style.setProperty("--ion-color-primary",d.primary),i.style.setProperty("--ion-background-color",d.background),i.style.setProperty("--ion-toolbar-background",d.surface),i.style.setProperty("--ion-text-color",d.textPrimary),i.style.setProperty("--ion-item-background",d.surface),i.style.setProperty("--ion-card-background",d.surface)}const a=p.useMemo(()=>be(t),[t]),n=p.useMemo(()=>({colors:a,colorsDark:A,isDark:o,themeMode:t,typ:M,sp:W,rad:I,sh:z,nav:H}),[a,o,t]);return c.jsx(ve.Provider,{value:n,children:e})}const we=`
/* ─── Color Palette ─────────────────────────────────────────────────────── */

/* Primary — Sacred Rose */
:root,
[data-theme="light"] {
  --ion-color-primary: #E91E8C;
  --ion-color-primary-rgb: 233, 30, 140;
  --ion-color-primary-contrast: #FFFFFF;
  --ion-color-primary-shade: #CC1A7A;
  --ion-color-primary-tint: #EB3598;

  --vf-primary: #E91E8C;
  --vf-primary-light: #FFB6CC;
  --vf-primary-dark: #B30069;

  /* Backgrounds */
  --ion-background-color: #fcf9f8;
  --ion-background-color-rgb: 252, 249, 248;
  --ion-item-background: #FFFFFF;
  --ion-card-background: #FFFFFF;
  --ion-toolbar-background: #FFFFFF;

  /* Text */
  --ion-text-color: #2D2D2D;
  --ion-text-color-rgb: 45, 45, 45;
  --ion-text-color-secondary: #594048;
  --ion-text-color-tertiary: #6E6E6E;
  --ion-text-color-muted: #A0A0A0;
  --ion-text-color-step-1: #2D2D2D;
  --ion-text-color-step-2: #594048;
  --ion-text-color-step-3: #6E6E6E;

  /* Borders */
  --ion-border-color: #FFE4EE;
  --ion-border-color-rgb: 255, 228, 238;
  --ion-item-border-color: #FFF0F6;

  /* Semantic */
  --vf-success: #008733;
  --vf-error: #FF6B6B;
  --vf-warning: #FF9500;
  --vf-info: #007AFF;

  /* VersyFlow tokens */
  --vf-background: #fcf9f8;
  --vf-surface: #FFFFFF;
  --vf-text-primary: #2D2D2D;
  --vf-text-secondary: #594048;
  --vf-text-tertiary: #6E6E6E;
  --vf-text-muted: #A0A0A0;
  --vf-border: #FFE4EE;
  --vf-divider: #FFF0F6;
  --vf-radius-sm: 8px;
  --vf-radius-md: 12px;
  --vf-radius-lg: 16px;
  --vf-radius-xl: 20px;
  --vf-radius-2xl: 24px;
  --vf-radius-full: 9999px;
  --vf-stack-sm: 8px;
  --vf-stack-md: 16px;
  --vf-stack-lg: 24px;
  --vf-spacing-xs: 4px;
  --vf-spacing-sm: 8px;
  --vf-spacing-md: 16px;
  --vf-spacing-lg: 24px;
  --vf-spacing-xl: 32px;
  --vf-tab-bar-height: 64px;
  --vf-header-height: 56px;
}

[data-theme="dark"] {
  --ion-color-primary: #E91E8C;
  --ion-color-primary-rgb: 233, 30, 140;
  --ion-color-primary-contrast: #FFFFFF;
  --ion-color-primary-shade: #CC1A7A;
  --ion-color-primary-tint: #EB3598;

  --vf-primary: #E91E8C;
  --vf-primary-light: #FFB6CC;
  --vf-primary-dark: #FF6BAC;

  /* Backgrounds */
  --ion-background-color: #121212;
  --ion-background-color-rgb: 18, 18, 18;
  --ion-item-background: #1E1E1E;
  --ion-card-background: #1E1E1E;
  --ion-toolbar-background: #1E1E1E;

  /* Text */
  --ion-text-color: #FFFFFF;
  --ion-text-color-rgb: 255, 255, 255;
  --ion-text-color-secondary: #B3B3B3;
  --ion-text-color-tertiary: #6E6E6E;
  --ion-text-color-muted: #535353;
  --ion-text-color-step-1: #FFFFFF;
  --ion-text-color-step-2: #B3B3B3;
  --ion-text-color-step-3: #6E6E6E;

  /* Borders */
  --ion-border-color: rgba(255, 255, 255, 0.08);
  --ion-border-color-rgb: 255, 255, 255, 0.08;
  --ion-item-border-color: rgba(255, 255, 255, 0.06);

  /* Semantic */
  --vf-success: #00C853;
  --vf-error: #FF5252;
  --vf-warning: #FFB300;
  --vf-info: #448AFF;

  /* VersyFlow tokens */
  --vf-background: #121212;
  --vf-surface: #1E1E1E;
  --vf-text-primary: #FFFFFF;
  --vf-text-secondary: #B3B3B3;
  --vf-text-tertiary: #6E6E6E;
  --vf-text-muted: #535353;
  --vf-border: rgba(255, 255, 255, 0.08);
  --vf-divider: rgba(255, 255, 255, 0.06);
}

/* ─── Typography ─────────────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --vf-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --vf-font-heading: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --vf-font-mono: 'Courier New', monospace;
  --vf-font-bible: 'Georgia', 'Times New Roman', serif;

  --vf-text-display-large: 32px;
  --vf-text-headline-medium: 24px;
  --vf-text-headline-small: 20px;
  --vf-text-title-large: 18px;
  --vf-text-title-medium: 16px;
  --vf-text-title-small: 14px;
  --vf-text-body-large: 16px;
  --vf-text-body-medium: 14px;
  --vf-text-body-small: 12px;
  --vf-text-label-large: 14px;
  --vf-text-label-medium: 12px;
  --vf-text-label-small: 11px;
  --vf-text-bible: 20px;
}

/* ─── Ionic Component Overrides ──────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-safe-area-top: env(safe-area-inset-top, 0px);
  --ion-safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --ion-safe-area-left: env(safe-area-inset-left, 0px);
  --ion-safe-area-right: env(safe-area-inset-right, 0px);
}

/* ─── Button Overrides ───────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-button-border-radius: 26px;
  --ion-button-font-weight: 600;
}

/* ─── Card Overrides ─────────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-card-border-radius: 20px;
  --ion-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* ─── Tab Bar Overrides ──────────────────────────────────────────────────── */

:root,
[data-theme="light"],
[data-theme="dark"] {
  --ion-tab-bar-height: 64px;
  --ion-tab-bar-border-width: 0;
}
`;function ke(){const e=document.createElement("style");e.textContent=we,document.head.appendChild(e)}const Ae=p.lazy(()=>v(()=>import("./index-BnynbPta.js"),__vite__mapDeps([0,1,2,3,4,5,6,7]))),Se=p.lazy(()=>v(()=>import("./explore-DHbOrmzN.js"),__vite__mapDeps([8,1,7,2,3,9]))),Ce=p.lazy(()=>v(()=>import("./progress-BAD_7fuO.js"),__vite__mapDeps([10,1,7,11,9,3]))),Re=p.lazy(()=>v(()=>import("./settings-C0ehBsOf.js"),__vite__mapDeps([12,1,7,2,3,4,5,6,11]))),De=p.lazy(()=>v(()=>import("./login-B6VT1hfd.js"),__vite__mapDeps([13,1,7,2,3,5]))),Be=p.lazy(()=>v(()=>import("./signup-1n9vDy-x.js"),__vite__mapDeps([14,1,2,3,5])));p.lazy(()=>v(()=>import("./splash-DZX5kgP_.js"),__vite__mapDeps([15,1,7,3])));const Le=p.lazy(()=>v(()=>import("./_not-found-DyQlMnd5.js"),__vite__mapDeps([16,3,1,7])));ke();function _e(){return c.jsx(p.StrictMode,{children:c.jsx(Y,{children:c.jsx(Ee,{children:c.jsx(G,{children:c.jsx(Q,{children:c.jsxs(X,{children:[c.jsx(b,{path:"/",element:c.jsx(Z,{to:"/tabs/home",replace:!0})}),c.jsx(b,{path:"/tabs/home",element:c.jsx(Ae,{})}),c.jsx(b,{path:"/tabs/explore",element:c.jsx(Se,{})}),c.jsx(b,{path:"/tabs/progress",element:c.jsx(Ce,{})}),c.jsx(b,{path:"/tabs/settings",element:c.jsx(Re,{})}),c.jsx(b,{path:"/auth/login",element:c.jsx(De,{})}),c.jsx(b,{path:"/auth/signup",element:c.jsx(Be,{})}),c.jsx(b,{path:"*",element:c.jsx(Le,{})})]})})})})})})}const N=document.getElementById("root");if(!N)throw new Error("Root element not found");const Te=oe.createRoot(N);Te.render(c.jsx(_e,{}));export{Me as A,A as C,Ve as E,ze as F,He as K,We as M,H as N,F as P,I as R,Pe as S,me as T,ie as V,ne as a,ae as b,le as c,se as d,Ie as e,Ne as f,be as g,z as h,W as i,c as j,M as k,D as l};
