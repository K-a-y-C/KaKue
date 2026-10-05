import {preflight} from './preflight.ts';
self.onmessage=event=>{try{self.postMessage({plan:preflight(event.data.points,event.data.standOffMm)});}catch(error){self.postMessage({error:error instanceof Error?error.message:String(error)});}};
