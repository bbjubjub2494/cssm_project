(()=>{function e(e,t){for(var i=0;i<t.length;i++){var s=t[i];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}var t=function(){function t(e,i){var s=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),this.size=5*e,this.streetSize=4,this.firstStreet=i,this.firstStreetOriginal=i,this.distanceBetweenStreets=51,this.numberOfStreets=5,this.vehicles=[],this.trafficLights=[],this.withBikeLane=!1,this.cameraOffset={x:0,y:0},this.cameraZoom=1,this.minZoom=1,this.maxZoom=10,this.scrollSensitivity=8e-4,this.isDragging=!1,this.dragStart={x:0,y:0},this.initialPinchDistance=null,this.lastZoom=this.cameraZoom,this.canvas=document.createElement("canvas"),this.canvas.style="width: 100%; max-width: 600px; border: 1px solid black; margin: 1rem 0 5rem;",document.getElementById("elements").appendChild(this.canvas),this.context=this.canvas.getContext("2d"),this.canvas.addEventListener("mousedown",(function(e){return s.onPointerDown(e)})),this.canvas.addEventListener("touchstart",(function(e){return s.handleTouch(e,s.onPointerDown)})),this.canvas.addEventListener("mouseup",(function(e){return s.onPointerUp(e)})),this.canvas.addEventListener("touchend",(function(e){return s.handleTouch(e,s.onPointerUp)})),this.canvas.addEventListener("mousemove",(function(e){return s.onPointerMove(e)})),this.canvas.addEventListener("touchmove",(function(e){return s.handleTouch(e,s.onPointerMove)})),this.canvas.addEventListener("wheel",(function(e){e.preventDefault(),s.adjustZoom(e.deltaY*s.scrollSensitivity)})),this.canvas.addEventListener("mouseleave",(function(e){return s.onPointerUp(e)})),this.imageBike=new Image,this.imageBike.src="/local/TrafficGrid/frontend/bike.svg",this.imageCar=new Image,this.imageCar.src="/local/TrafficGrid/frontend/car.svg",this.draw(this.context)}var i,s,a;return i=t,(s=[{key:"draw",value:function(e){var t=this;this.canvas.width=this.size,this.canvas.height=this.size,e.translate(this.size/2,this.size/2),e.scale(this.cameraZoom,this.cameraZoom),e.translate(-this.size/2+this.cameraOffset.x,-this.size/2+this.cameraOffset.y),e.clearRect(0,0,this.size,this.size),e.lineWidth=1,e.strokeStyle="#666";var i=5*this.firstStreet;e.beginPath();for(var s=0;s<this.numberOfStreets;s++)e.moveTo(i,0),e.lineTo(i,this.size),e.moveTo(0,i),e.lineTo(this.size,i),i+=5*this.streetSize,e.moveTo(i,0),e.lineTo(i,this.size),e.moveTo(0,i),e.lineTo(this.size,i),i+=5*this.distanceBetweenStreets;e.stroke();var a=this.distanceBetweenStreets+this.streetSize;i=5*(this.firstStreet+this.streetSize/2);for(var n=0;n<this.numberOfStreets;n++)e.beginPath(),e.setLineDash([10,10]),e.lineDashOffset=10,e.strokeStyle="#666",e.moveTo(i,0),e.lineTo(i,this.size),e.moveTo(0,i),e.lineTo(this.size,i),e.stroke(),this.withBikeLane&&(e.beginPath(),e.setLineDash([5,5]),e.lineDashOffset=0,e.strokeStyle="#d67d00",e.moveTo(i-10,0),e.lineTo(i-10,this.size),e.moveTo(i+10,0),e.lineTo(i+10,this.size),e.moveTo(0,i-10),e.lineTo(this.size,i-10,this.size),e.moveTo(0,i+10),e.lineTo(this.size,i+10),e.stroke()),i+=5*a;e.stroke(),e.setLineDash([]);for(var r=0;r<this.numberOfStreets;r++)for(var o=0;o<this.numberOfStreets;o++)e.clearRect(5*(r*a+this.firstStreet),5*(o*a+this.firstStreet),5*this.streetSize,5*this.streetSize);this.vehicles.forEach((function(i){var s,a,n,r=i.x,o=i.y;if(0===i.type)switch(s=t.imageCar,n="blue",a=2,i.dir){case 0:r-=1,o-=1;break;case 1:o-=1;break;case 2:break;case 3:r-=1}else 1===i.type&&(s=t.imageBike,a=1,n="orange");a*=5,e.fillStyle=n,e.fillRect(5*r,5*o,a,a),e.save(),e.translate(5*r+a/2,5*o+a/2),e.rotate((-1+i.dir)*Math.PI/2),e.translate(5*-r-a/2,5*-o-a/2),e.drawImage(s,5*r,5*o,a,a),e.restore()})),this.trafficLights.forEach((function(i){e.lineWidth=3,e.strokeStyle=1===i.state?"red":"green",e.beginPath(),e.moveTo(5*i.x,5*i.y),e.lineTo(5*i.x,5*(i.y+t.streetSize)),e.moveTo(5*(i.x+t.streetSize),5*i.y),e.lineTo(5*(i.x+t.streetSize),5*(i.y+t.streetSize)),e.stroke(),e.strokeStyle=0===i.state?"red":"green",e.beginPath(),e.moveTo(5*i.x,5*i.y),e.lineTo(5*(i.x+t.streetSize),5*i.y),e.moveTo(5*i.x,5*(i.y+t.streetSize)),e.lineTo(5*(i.x+t.streetSize),5*(i.y+t.streetSize)),e.stroke(),t.withBikeBox&&(e.lineWidth=1.5,e.strokeStyle="#666",e.beginPath(),e.moveTo(5*(i.x-1),5*(i.y+t.streetSize/2)),e.lineTo(5*(i.x-1),5*(i.y+t.streetSize-1)),e.moveTo(5*(i.x+t.streetSize+1),5*(i.y+1)),e.lineTo(5*(i.x+t.streetSize+1),5*(i.y+t.streetSize/2)),e.moveTo(5*(i.x+1),5*(i.y-1)),e.lineTo(5*(i.x+t.streetSize/2),5*(i.y-1)),e.moveTo(5*(i.x+t.streetSize/2),5*(i.y+t.streetSize+1)),e.lineTo(5*(i.x+t.streetSize-1),5*(i.y+t.streetSize+1)),e.stroke())})),window.requestAnimationFrame((function(){return t.draw(e)}))}},{key:"getEventLocation",value:function(e){return e.touches&&1==e.touches.length?{x:e.touches[0].clientX,y:e.touches[0].clientY}:e.clientX&&e.clientY?{x:e.clientX,y:e.clientY}:{x:0,y:0}}},{key:"onPointerDown",value:function(e){this.isDragging=!0,this.dragStart.x=this.getEventLocation(e).x/this.cameraZoom-this.cameraOffset.x,this.dragStart.y=this.getEventLocation(e).y/this.cameraZoom-this.cameraOffset.y}},{key:"onPointerUp",value:function(e){this.isDragging=!1,this.initialPinchDistance=null,this.lastZoom=this.cameraZoom}},{key:"onPointerMove",value:function(e){this.isDragging&&this.setCameraOffset(this.getEventLocation(e).x/this.cameraZoom-this.dragStart.x,this.getEventLocation(e).y/this.cameraZoom-this.dragStart.y)}},{key:"setCameraOffset",value:function(e,t){var i=this.size*(this.cameraZoom-1)/(2*this.cameraZoom);e=Math.sign(e)*Math.min(i,Math.abs(e)),t=Math.sign(t)*Math.min(i,Math.abs(t)),this.cameraOffset.x=e,this.cameraOffset.y=t}},{key:"handleTouch",value:function(e,t){e.preventDefault(),1==e.touches.length?t.call(this,e):"touchmove"==e.type&&2==e.touches.length&&(this.isDragging=!1,this.handlePinch(e))}},{key:"handlePinch",value:function(e){e.preventDefault();var t=e.touches[0].clientX,i=e.touches[0].clientY,s=e.touches[1].clientX,a=e.touches[1].clientY,n=Math.pow(t-s,2)+Math.pow(i-a,2);null==this.initialPinchDistance?this.initialPinchDistance=n:this.adjustZoom(null,n/this.initialPinchDistance)}},{key:"adjustZoom",value:function(e,t){this.isDragging||(e?this.cameraZoom-=e:t&&(this.cameraZoom=t*this.lastZoom),this.cameraZoom=Math.min(this.cameraZoom,this.maxZoom),this.cameraZoom=Math.max(this.cameraZoom,this.minZoom),this.setCameraOffset(this.cameraOffset.x,this.cameraOffset.y))}},{key:"render",value:function(e){this.withBikeLane=e.with_bike_lane,this.withBikeBox=e.with_bike_box,this.vehicles=e.vehicles,this.trafficLights=e.traffic_lights,this.withBikeLane?(this.streetSize=6,this.firstStreet=this.firstStreetOriginal-1,this.distanceBetweenStreets=50):(this.streetSize=4,this.firstStreet=this.firstStreetOriginal,this.distanceBetweenStreets=51)}},{key:"reset",value:function(){this.vehicles=[],this.trafficLights=[]}}])&&e(i.prototype,s),a&&e(i,a),Object.defineProperty(i,"prototype",{writable:!1}),t}();window.TrafficModel=t})();