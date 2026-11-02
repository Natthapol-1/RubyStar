'use client';
import type {ButtonHTMLAttributes} from 'react';
import {playUiSfx,type UiSfx} from './ui-sfx';
export default function MenuButton({sound='confirm',onClick,onMouseEnter,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{sound?:UiSfx}){
 return <button type="button" {...props} onMouseEnter={e=>{if(!props.disabled)playUiSfx('hover');onMouseEnter?.(e);}} onClick={e=>{playUiSfx(sound);onClick?.(e);}}/>;
}
