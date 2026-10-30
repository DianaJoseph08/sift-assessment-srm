import {useState,useEffect} from 'react';
import {createNavigationHistory} from './navigation-history.mjs';
const navigation=createNavigationHistory(window);
export function useNavigation(){const [route,setRoute]=useState(()=>navigation.read());useEffect(()=>navigation.subscribe(setRoute),[]);return [route,patch=>setRoute(navigation.update(patch))];}
