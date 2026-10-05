import {Matrix4,Vector3} from 'three';
// Independent Three.js transform composition with measured CAD dimensions and signed axes.
export function measuredEmitter(q:readonly number[]) {
 const m=new Matrix4();
 const origins=[[0,0,.52],[.16,0,0],[.78,0,0],[.655,0,.15],[0,0,0],[.153,0,0]];
 const axes=[[0,0,-1],[0,1,0],[0,1,0],[-1,0,0],[0,1,0],[-1,0,0]];
 for(let i=0;i<6;i++)m.multiply(new Matrix4().makeTranslation(...origins[i] as [number,number,number])).multiply(new Matrix4().makeRotationAxis(new Vector3(...axes[i] as [number,number,number]),q[i]));
 m.multiply(new Matrix4().makeTranslation(.08,0,0)).multiply(new Matrix4().makeRotationY(Math.PI/2));
 return m.elements;
}

