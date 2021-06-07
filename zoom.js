var canvas = document.getElementById('demoCanvas');
var stage = new createjs.Stage(canvas);
var container = new createjs.Container();

var sqaure = new createjs.Shape();
var circle = new createjs.Shape();

var width = 250;
var height = 200;

sqaure.graphics.beginFill("red").drawRect(0, 0, width, height);
sqaure.setBounds(0, 0, width, height);
circle.graphics.beginFill("yellow").drawCircle(0, 0, 5);
circle.x = width - 10;
circle.y = height - 10;

container.regX = width / 2;
container.regY = height / 2;

container.addChild(sqaure);
container.addChild(circle);

container.x = 200;
container.y = 200;

stage.addChild(container);    
var dragStart = null;

function zoom(delta){
    var p = container.globalToLocal(stage.mouseX, stage.mouseY);

    var scale = Math.max(0.5, Math.min(container.scaleX + delta, 3));

    container.scaleX = container.scaleY = scale;

    var p2 = container.globalToLocal(stage.mouseX, stage.mouseY);
    if(container.rotation == 0){
        container.x += (p2.x - p.x) * scale;
        container.y += (p2.y - p.y) * scale;
    }else if (container.rotation == 90){
        container.x -= (p2.y - p.y) * (scale);
        container.y += (p2.x - p.x) * (scale);
    }else if(container.rotation == 180){
        container.x -= (p2.x - p.x) * scale;
        container.y -= (p2.y - p.y) * scale;
    }else{
        container.x += (p2.y - p.y) * (scale);
        container.y -= (p2.x - p.x) * (scale);
    }

}

function rotate(r){

    if((container.rotation+r)  > 270){
        container.rotation = 0;
    }else{
        container.rotation += r;
    }
}

function onMouseDown(){
  dragStart = new createjs.Point(stage.mouseX, stage.mouseY);
}

function onMouseMove(){
  if (dragStart){
    var mouse = new createjs.Point(stage.mouseX, stage.mouseY);
    var delta = new createjs.Point(mouse.x - dragStart.x, mouse.y - dragStart.y);
    dragStart = mouse;

    container.x += delta.x;
    container.y += delta.y;
  }
}

function onMouseUp(){
  dragStart = null;
}

function onMouseWheel(e){
  var delta = e.wheelDelta ? e.wheelDelta/1000 : e.detail ? -e.detail : 0;
  if (delta) zoom(delta);
  return e.preventDefault() && false;
}

function onTick(){
  stage.update();
}

createjs.Ticker.addEventListener("tick", onTick);
stage.addEventListener('mousedown', onMouseDown);
stage.addEventListener('stagemousemove', onMouseMove);
stage.addEventListener('stagemouseup', onMouseUp);
stage.addEventListener('mouseleave', onMouseUp);
canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
canvas.addEventListener('mousewheel', onMouseWheel, false);