export default function LobbyUtilityIcon({kind}:{kind:'book'|'settings'}){
 const color=kind==='book'?'#b6a8f1':'#8fd6ce';
 return <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true" shapeRendering="crispEdges" style={{filter:`drop-shadow(0 0 3px ${color}55)`}}>
 {kind==='book'?<><path d="M3 5H11V7H17V5H25V23H17V25H11V23H3Z" fill={color}/><path d="M5 7H10V9H13V22H11V21H5ZM18 7H23V21H17V22H15V9H18Z" fill="#22253d"/><path d="M7 10H10V12H7ZM7 15H11V17H7ZM18 10H21V12H18ZM17 15H21V17H17Z" fill="#e6e4ff"/><rect x="13" y="8" width="2" height="15" fill="#f0e8ff"/></>:
 <><path d="M10 2H18V6H22V10H26V18H22V22H18V26H10V22H6V18H2V10H6V6H10Z" fill={color}/><path d="M10 8H18V10H20V18H18V20H10V18H8V10H10Z" fill="#17343b"/><rect x="11" y="11" width="6" height="6" fill="#daf9ed"/><rect x="10" y="3" width="6" height="2" fill="#eafff5"/></>}
 </svg>;
}
