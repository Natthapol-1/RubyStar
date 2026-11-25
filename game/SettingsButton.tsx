'use client';
import MenuButton from './MenuButton';
import LobbyUtilityIcon from './LobbyUtilityIcon';

export default function SettingsButton({onClick}:{onClick:()=>void}){
 return <MenuButton className="rs-icon-button rs-settings-button" sound="page" aria-label="Settings" title="Settings" onClick={onClick}
  style={{width:48,height:44,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',padding:0,background:'#10192be8',border:'1px solid #639d9a',cursor:'pointer',boxShadow:'inset 0 0 0 3px #18263a,0 0 12px #8fc9e31c'}}><LobbyUtilityIcon kind="settings"/></MenuButton>;
}
