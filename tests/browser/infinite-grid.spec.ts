import {test,expect} from './fixtures';

test('grid extends beyond the solid base with blue visible between its lines',async({page},testInfo)=>{
 test.setTimeout(60000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 const checkGrid=async(name:string)=>{
 const screenshot=await canvas.screenshot({path:testInfo.outputPath(name+'.png')});
 const pixels=await page.evaluate(async encoded=>{
  const source=new Image();source.src=`data:image/png;base64,${encoded}`;await source.decode();
  const image=document.createElement('canvas');image.width=source.width;image.height=source.height;
  const context=image.getContext('2d')!;context.drawImage(source,0,0);
  // This region is outside the unchanged four-meter platform, away from the CAD.
  const data=context.getImageData(Math.round(image.width*.02),Math.round(image.height*.3),Math.round(image.width*.2),Math.round(image.height*.15)).data;
  let blue=0,lines=0;
  for(let i=0;i<data.length;i+=4){if(data[i]===0&&data[i+1]===64&&data[i+2]===151)blue++;else lines++;}
  return {blue,lines,total:data.length/4};
 },screenshot.toString('base64'));
 expect(pixels.lines).toBeGreaterThan(150);
 expect(pixels.blue/pixels.total).toBeGreaterThan(.6);
 };
 await checkGrid('infinite-grid');
 const box=(await canvas.boundingBox())!;
 await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);
 await page.mouse.down({button:'right'});
 await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:12});
 await page.mouse.up({button:'right'});
 await checkGrid('infinite-grid-panned');
 await expect(page.getByRole('row')).toHaveCount(1);
});
