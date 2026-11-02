export default function ShieldAmount({amount,ruby=false}:{amount:number;ruby?:boolean}){
  const label=`${ruby?'Ruby':'Your'} shield: ${Math.ceil(amount)}`;
  return <div className="rs-time" role="img" aria-label={label} title={label} style={{flexDirection:'row',gap:4}}>
    <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M4 1H14V3H17V11H15V15H12V18H6V15H3V11H1V3H4Z" fill="#173d49"/>
      <path d="M4 1H14V3H17V11H15V15H12V18H6V15H3V11H1V3H4Z" fill="none" stroke={ruby?'#e6a4c0':'#a8e8d7'} strokeWidth="2"/>
      <path d="M5 4H12V6H5V11H3V4Z" fill={ruby?'#ffd1e4':'#dcfff2'}/>
    </svg>
    <span>{Math.ceil(amount)}</span>
  </div>;
}
