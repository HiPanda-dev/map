var lib, canvas, mcGame, mcSetting, mcDriver, stage, mcLine, coordList = [];
var mcContainer, rootX, rootY, spaceX, spaceY;
// Driver
var listPos;
var startPos;
var isChoose = false;
var listDriver;

// Setting
var btnNewRound;
var btnResetAll;
var btnCapture;
var btnGo;
var btnCome;

// App
var STATE = 0;
var curDriver = 4;
var mapVO;
var driverVO;

// Map
var container;
var mcRoutes = [];
var mcCity = [];
var mcStartPoint;
var mcEndPoint;
var curPoint;
var curZoom = 0;
var isCapture = false;
var dontDrag = false;
        
var WIDTH;
var HEIGHT;

// Viet Nam
var curPosRoute;
var listCountPoint = [];
var isFirst = false;
var isCapture = false;
var drawWithMouse;

function showGame(_lib, _canvas, _mcGame, _mcSetting, _mcDriver, _stage){
    createjs.Touch.enable(_stage, false, true);
    _stage.preventSelection = false
    this.stage = _stage;
    this.lib = _lib;
    this.canvas = _canvas;
    this.mcGame = _mcGame;
    this.mcSetting = _mcSetting;
    this.mcDriver = _mcDriver;

    this.WIDTH = stage.width;
    this.HEIGHT = stage.height;

    mcContainer =  new createjs.MovieClip();
    stage.addChild(mcContainer);
    stage.snapToPixel = true;

    //init driver
    this.listPos = [];
    listDriver = [this.mcDriver.mcDriver_1, this.mcDriver.mcDriver_2, this.mcDriver.mcDriver_3, this.mcDriver.mcDriver_4, this.mcDriver.mcDriver_5, this.mcDriver.mcDriver_6];
    for (var i = 0; i < listDriver.length; i++) {
        var movie = new createjs.MovieClip();
        movie = listDriver[i];
        movie.addEventListener("mouseup", driverMouseEvent.bind(this));
        listPos[i] = {x: movie.x, y: movie.y};
    }

    this.startPos = listPos[0];
    setSelectPos(4);

    //init setting
    btnNewRound = this.mcSetting.btnNewRound;
    btnResetAll = this.mcSetting.btnResetAll;
    btnCapture = this.mcSetting.btnCapture;
    btnGo = this.mcSetting.btnGo;
    btnCome = this.mcSetting.btnCome;
    btnNewRound.addEventListener("click", onNewRound.bind(this));
    btnResetAll.addEventListener("click", onResetAll.bind(this));
    btnCapture.addEventListener("click", onCapture.bind(this));
    btnGo.addEventListener("click", onGo.bind(this));
    btnCome.addEventListener("click", onCome.bind(this));
    this.onDisableNewRound();

    //init VietNam
    Object.entries(this.mcGame.mcRoutes).forEach(element => {
        var name = element[0];
        if(name != '' && name != ''){
            var str = name.split('_');
            if(str.length > 0){
                if(str[0] == "VN" || str[0] == "KH" || str[0] == "LA"){
                    var movie = new createjs.MovieClip();
                    movie = element[1];
                    movie.mcAnim.visible = false;
                    movie.mcAnim.mouseChildren = movie.mcAnim.mouseEnabled = false;
                    movie.addEventListener("click", nodeClickEvent.bind(this));
                    this.mcRoutes.push(movie);
                }
            }
        }
    });

    Object.entries(this.mcGame.mcCity).forEach(element => {
        var name = element[0];
        if(name != '' && name != ''){
            var str = name.split('_');
            if(str.length > 0){
                if(str[0] == "VN" || str[0] == "KH" || str[0] == "LA"){
                    var movie = new createjs.MovieClip();
                    movie = element[1];
                    this.mcCity.push(movie);
                }
            }
        }
    });

    // load config file
    fetch("./config/config.json")
    .then(function(resp) {
        return resp.json();
    })
    .then(function(data) {
        this.updateMap(data.map);
        this.updateDriver(data.driver);
    });

    // Init Map
    // this.canvas.addEventListener("mousewheel", handleMouseWheel.bind(this));
    // stage.addEventListener("stagemousedown", handleMouseDown.bind(this));
}

//Map
function handleMouseWheel(e) {
    var point = new Point(stage.mouseX, stage.mouseY);
    if(e.wheelDelta < 0){
        if(this.curZoom <= 0) return;
        var local = stage.globalToLocal(stage.mouseX, stage.mouseY);
        stage.regX = local.x;
        stage.regY = local.y;
        stage.x = stage.mouseX;
        stage.y = stage.mouseY;
        stage.scaleX = stage.scaleY *= 0.96;
        this.curZoom--;

        if (this.stage.width < WIDTH) this.stage.width = WIDTH;
        if (this.stage.height < HEIGHT) this.stage.height = HEIGHT;
        
        // if (this.stage.x > 0) this.stage.x = 0;
        // if (this.stage.y > 0) this.stage.y = 0;
        // if (this.stage.x + this.stage.width < stage.stageWidth) this.x = stage.stageWidth - this.width;
        // if (this.stage.y + this.stage.height < stage.stageHeight) this.y = stage.stageHeight - this.height;
    }else{
        if (this.curZoom == 30) return;
        stage.scaleX = stage.scaleY *= 1.04;
        this.curZoom++;
    }
    stage.cache(0, 0, stage.width, stage.height);
    stage.uncache();
    stage.update();

    // if(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))>0)
	// 	zoom = 1.1;
	// else
	// 	zoom = 1/1.1;
    // var local = stage.globalToLocal(stage.mouseX, stage.mouseY);
    // stage.regX = local.x;
    // stage.regY = local.y;
	// stage.x = stage.mouseX;
	// stage.y = stage.mouseY;	
	// stage.scaleX = stage.scaleY *= zoom;
	// stage.update();
}
function handleMouseDown(e) {
    createjs.Ticker.addEventListener("tick", tick);
    this.toggleCache(true);
    var offset = { x: stage.x - e.stageX,
                   y: stage.y - e.stageY };
    stage.addEventListener("stagemousemove",function(ev) {
        stage.x = ev.stageX + offset.x;
        stage.y = ev.stageY + offset.y;
        // if(stage.x > 0) stage.x = 0;
        // if(stage.y > 0) stage.y = 0;
        // stage.cache(0, 0, stage.width, stage.height);
        stage.update();
    });
    stage.addEventListener("stagemouseup", function(){
        createjs.Ticker.removeEventListener("tick", tick);
        this.toggleCache(false);
        stage.removeAllEventListeners("stagemousemove");
    });
}

function tick(event) {
    console.log('dassda');
    stage.update(event);
}

function toggleCache(value) {
	var l = stage.numChildren - 1;
	for (var i = 0; i < l; i++) {
		var shape = stage.getChildAt(i);
		if (value) {
			shape.cache(0, 0, shape.width, shape.height);
		} else {
			shape.uncache();
		}
	}
}

function resetSizeMap() {
    this.width = stage.stageWidth;
    this.height = stage.stageHeight;
    curZoom = 0;
    this.x = 0;
    this.y = 0;
}

//Function Driver
function driverMouseEvent(e) {
    var movie = e.currentTarget;
    if (isChoose) {
        isChoose = false;
        resetDriver();
        for (var i = 0; i < listDriver.length; i++) {
            var mc = listDriver[i];
            createjs.Tween.get(mc).to({x: listPos[i].x, y: listPos[i].y}, 0.08 * i)
            // TweenLite.to(mc, 0.08 * i, {x: listPos[i].x, y: listPos[i].y})
        }
    } else {
        var arr = movie.name.split("_");
        setSelectPos(arr[1]);
    }
}

function resetDriver() {
    for (var i = 0; i < listDriver.length; i++) {
        var movie = listDriver[i];
        // this.mcGame.addChild(movie);
    }
}

function setSelectPos(id) {
    resetDriver();
    for (var i = 0; i < listDriver.length; i++) {
        var movie = listDriver[i];
        createjs.Tween.get(movie).to({x: startPos.x, y: startPos.y}, 0.08 * i)
    }
    isChoose = true;
    movie = this.mcDriver.getChildByName("mcDriver_" + id);
    // this.mcGame.addChild(movie);
    
    this.curDriver = id;
    // stage.dispatchEvent(new Event("CHANGE_DRIVER"));
}

//Function setting
function onCome(e) {
    stage.dispatchEvent(new Event("ON_COME"));
    stage.dispatchEvent(new Event("NEW_ROUND"));
    btnCome.alpha = 0.5;
    btnGo.alpha = 1;
    
    this.STATE = 2;
}

function onGo(e) {
    stage.dispatchEvent(new Event("ON_GO"));
    stage.dispatchEvent(new Event("NEW_ROUND"));
    btnGo.alpha = 0.5;
    btnCome.alpha = 1;
    
    this.STATE = 1;
}

function onCapture(e) {
    this.isCapture = true;
    this.dontDrag = true;
    this.mcSetting.visible = false;
    this.mcDriver.visible = false;
    // vn.dontDrag = true;	
    // vn.resetSizeMap();
    // vn.hideAllPoitNotCapture();
    this.drawLayer = new createjs.Shape();
    stage.addChild(drawLayer);
    // stage.addEventListener("mousedown", mdown);
}

function mdown(e) {
    if (isCapture == false) return;
    startPoint = new Point(e.stageX, e.stageY);
    stage.addEventListener("mousemove", mmove);
    stage.addEventListener("mouseup", mup);
}

function mmove(e) {
    drawLayer.graphics.clear();
    drawLayer.graphics.lineStyle(1, 0x000000);
    var newx = e.stageX;
    var newy = e.stageY;
    var top = Math.min(newy, startPoint.y);
    var left = Math.min(newx, startPoint.x);
    var w = Math.abs(newx - startPoint.x);
    var h = Math.abs(newy - startPoint.y);
    drawLayer.graphics.drawRect(left, top, w, h);
}

function mup(e) {
    stage.removeEventListener(MouseEvent.MOUSE_MOVE, mmove);
    stage.removeEventListener(MouseEvent.MOUSE_UP, mup);
    
    var endPoint = new Point(e.stageX, e.stageY);
    
    captureMap(startPoint, endPoint);
}

function onDisableNewRound(e) {
    btnNewRound.alpha = 0.5;
    btnNewRound.mouseEnabled = false;
}

function onEnableNewRound(e) {
    btnNewRound.alpha = 1;
    btnNewRound.mouseEnabled = true;
    btnGo.alpha = 1;
    btnCome.alpha = 1;
    this.STATE = 0;
}

function onNewRound(e) {
    if (isFirst && mcStartPoint && !mcEndPoint) {
        mcStartPoint.mcAnim.visible = false
    }
    mcStartPoint = null;
    mcEndPoint = null;
    showAbleRouteSelect();

    this.onDisableNewRound();
    btnGo.alpha = 1;
    btnCome.alpha = 1;
    this.STATE = 0;
}

function onResetAll(e) {
    this.removeAllRoute();
    mcStartPoint = null;
    mcEndPoint = null;
    listCountPoint = [];
    for (var j = 0; j < mcRoutes.numChildren; j++) {
        var movie = new createjs.MovieClip;
        movie = mcRoutes.getChildAt(j);
        movie.mcAnim.visible = false;
        movie.mouseChildren = movie.mouseEnabled = true;
        movie.mcPoint.alpha = 1;
        movie.isActive = false;
        movie.visible  = true;
    }
    
    for (var j = 0; j < mcCity.numChildren; j++) {
        var movie = createjs.MovieClip;
        movie = mcCity.getChildAt(j);
        movie.visible  = true;
    }

    btnGo.alpha = 1;
    btnCome.alpha = 1;
    
    this.STATE = 0;
}

function onChangeDriver(e) {
    this.mcStartPoint = null;
    this.mcEndPoint = null;
    showAbleRouteSelect();
}

//Function load config
function updateMap(data) {
    this.mapVO = new MapVO();
    mapVO.updateData(data);
    mapVO.loadRoutedata();
}

function updateDriver(data) {
    this.driverVO = new DriverVO();
    driverVO.updateData(data);
}

//Function VietNam
function nodeClickEvent(e) {
    var movie = e.currentTarget;
    if (mcStartPoint == movie) return;
    if (!mcStartPoint) {
        mcStartPoint = movie;
        mcStartPoint.mcAnim.visible = true;
        mcStartPoint.isActive = true;
        showAbleRouteSelect();
        if (this.STATE != 0) {
            this.loadGlobalPoint();
        }
        isFirst = true;
    } else {
        if (mcEndPoint != movie) {
            if (mcEndPoint) {
                mcEndPoint.mcAnim.visible = false;
            }
            mcEndPoint = movie;
            mcEndPoint.mcAnim.visible = true;
            mcEndPoint.isActive = true;
            this.loadRoutePoint();
        } else {
            mcStartPoint.mcAnim.visible = false;
            mcStartPoint = movie;
            mcEndPoint.mcAnim.visible = false;
            mcStartPoint.mcAnim.visible = true;
            mcEndPoint = null;
            this.removeAllRoute();
            this.showAbleRouteSelect();
        }
        isFirst = false;
    }
}

function loadRoutePoint() {
    var aStart = mcStartPoint.name.split("_");
    var aEnd = mcEndPoint.name.split("_");
    
    var nameStartPoint = aStart[1];
    var nameEndPoint = aEnd[1];
    
    var nameStartCountry = aStart[0];
    var nameEndCountry = aEnd[0];
    
    var country = (nameStartCountry == nameEndCountry) ? nameStartCountry : "global";
    
    var id = (nameStartCountry == nameEndCountry) ? nameStartPoint + "-" + nameEndPoint : mcStartPoint.name + "-" + mcEndPoint.name;
    var curMap = getChildByID(this.mapVO.maps, country);
    var route = getChildByID(curMap.routes, id);
    if (route) {
        loadRouteImage(country, route);
    } else {
        id = (nameStartCountry == nameEndCountry) ? nameEndPoint + "-" + nameStartPoint : mcEndPoint.name + "-" + mcStartPoint.name;
        route = getChildByID(curMap.routes, id);
        if (route) {
            loadRouteImage(country, route);
            // console.log("using different route");
        } else {
            //loadRouteGlobalPoint(mcStartPoint, mcEndPoint);
        }
    }
}

function onRemoveLine(e) {
    var line = new createjs.MovieClip();
    line = e.currentTarget;
    if (RealHitTest(line.getChildAt(0), new Point(e.stageX, e.stageY))) {
        this.mcContainer.removeChild(line);
        if (listCountPoint[line.mcStartPoint.name] != null) {
            listCountPoint[line.mcStartPoint.name] -= 1;
            if (listCountPoint[line.mcStartPoint.name] == 0) line.mcStartPoint.mcAnim.visible = false;
        }
        
        if (listCountPoint[line.mcEndPoint.name] != null) {
            listCountPoint[line.mcEndPoint.name] -= 1;
            if (listCountPoint[line.mcEndPoint.name] == 0) line.mcEndPoint.mcAnim.visible = false;
        }
        if (isFirst && mcStartPoint && !mcEndPoint) {
            mcStartPoint.mcAnim.visible = false
        }
        
        mcStartPoint = null;
        mcEndPoint = null;
        showAbleRouteSelect();
    }
}

function showAbleRouteSelect() {
    if (nameStartCountry == "global") return;
    if (!mcStartPoint) {
        setAlphaRoute(1);
        
        return;
    }
    var aStart = mcStartPoint.name.split("_");
    var nameStartPoint = aStart[1];
    var nameStartCountry = aStart[0];
    setAlphaRoute(0.5);
    
    mcStartPoint.mcPoint.alpha = 1;
    mcStartPoint.visible = true;
    // var startPointCity = mcCity.getChildByName(mcStartPoint.name);
    var startPointCity = getChildByName(this.mcCity, mcStartPoint.name);
    startPointCity.visible = true;

    var routes = this.mapVO.getObjByID(nameStartCountry).routes;
    for (let i = 0; i < routes.length; i++) {
        var roulete = routes[i];
        var a = roulete.id.split("-");
        if (roulete.driver[this.curDriver - 1].pos == null) continue;
        if (roulete.driver[this.curDriver - 1].pos == "null") continue;
        if (roulete.driver[this.curDriver - 1].pos == "") continue;
        if (nameStartPoint == a[0]  || nameStartPoint  == a[1]) {
            var name = (nameStartPoint == a[0]) ? a[1] : a[0]
            var movie = getChildByName(this.mcRoutes, nameStartCountry + "_" + name);
            var movieCity = getChildByName(this.mcCity, nameStartCountry + "_" + name);
            if (movie) {
                // movie.mcPoint.alpha = 1;
                movie.mouseChildren = movie.mouseEnabled = true;
                movie.visible = true;
            }
            if (movieCity) movieCity.visible = movie.visible;
        }
    }

    // movie = mcRoutes.getChildByName(nameStartCountry + "_" + nameStartPoint);
    var route = getChildByName(this.mcRoutes, nameStartCountry + "_" + nameStartPoint);
    // movieCity = mcCity.getChildByName(nameStartCountry + "_" + nameStartPoint);
    var city = getChildByName(this.mcCity, nameStartCountry + "_" + nameStartPoint);
    if (route) {
        route.mcPoint.alpha = 1;
        route.mouseChildren = route.mouseEnabled = true;
    }
    if (city) city.visible = route.visible;
    this.showAbleRouteGlobalSelect();
}

function setAlphaRoute(alpha) {
    this.mcRoutes.forEach(element => {
        var route = element;
        var city = new createjs.MovieClip();
        this.mcCity.forEach(element1 => {
            if(element1.name == route.name){
                city = element;
            }
        });
        route.visible = (alpha === 1) ? true : false;
        if(route.isActive) route.visible = true;
        if(city) city.visible = route.visible;
    });
}

function loadGlobalPoint() {
    mcEndPoint = new createjs.MovieClip();
    mcEndPoint.name = "global";
    mcEndPoint.mcPoint = new createjs.MovieClip();
    mcEndPoint.mcAnim = new createjs.MovieClip();
    
    var aStart = mcStartPoint.name.split("_");
    var nameStartPoint = mcStartPoint.name;
    var country = "global";
    var id = "";
    if (this.STATE == 1) {
        id = nameStartPoint + "-" + mcEndPoint.name;
    }else if (this.STATE == 2){
        id =  mcEndPoint.name + "-" + nameStartPoint;
        var temp = mcStartPoint;
        mcStartPoint = mcEndPoint;
        mcEndPoint = temp;
    }
}

function showAbleRouteGlobalSelect() {
    var nameStartPoint = mcStartPoint.name;
    var routes = this.mapVO.getObjByID("global").routes;
    for (let i = 0; i < routes.length; i++) {
        var roulete = routes[i];
        var a = roulete.id.split("-");
        if (roulete.driver[this.curDriver - 1] == null) continue;
        if (roulete.driver[this.curDriver - 1].pos == null) continue;
        if (roulete.driver[this.curDriver - 1].pos == "null") continue;
        if (roulete.driver[this.curDriver - 1].pos == "") continue;
        if (nameStartPoint == a[0] || nameStartPoint == a[1]) {
            var name = (nameStartPoint == a[0]) ? a[1] : a[0]
            var movie = getChildByName(this.mcRoutes, name);
            var movieCity = getChildByName(this.mcCity, name);
            if (movie) {
                movie.mcPoint.alpha = 1;
                movie.visible = true;
                movie.mouseChildren = movie.mouseEnabled = true;
            }
            if (movieCity) movieCity.visible = movie.visible;
        }
    }
}

function removeAllRoute() {
    this.mcContainer.removeAllChildren();
    // if (container.numChildren != 0) container.removeChildren(0, container.numChildren - 1);
}

function loadRouteImage(country, route) { //country:String, route:RouteVO
    var pos = new Point();
    pos = getCurPosByIdDriver(route.driver, this.curDriver);
    var nameFolder = getChildByID(this.driverVO.listDriver, this.curDriver).name;
    if (nameFolder == "") {
        console.log("not driver");
        return;
    }
    curPosRoute = pos;
    //ファイル情報の保存先
    var url =  "./assets/route/" + country + "/" + nameFolder + "/" + route.name;
    console.log(url);
    let images = [];

    function lorder(){
        let manifest=[
            {src:url,id:"kitarou"},
        ];

        let loader = new createjs.LoadQueue(false);
            loader.loadManifest(manifest,true);
            loader.addEventListener("fileload", fileload);
            loader.addEventListener("complete", complete);
        
        function fileload(event){
            if (event.item.type == "image"){
                images[event.item.id] = event.result;
            }
        }

        function complete (event) {
            event.target.removeEventListener("fileload",fileload);
            event.target.removeEventListener("complete",complete);
            init();
        }
    }

    function init() {
        let stage = new createjs.Stage("main");
        let bg = new createjs.Shape();
        bg.graphics.beginFill("black").drawRect(0, 0, 500, 300);
        stage.addChild(bg);

        let image = new createjs.Bitmap(images["kitarou"]);
        image.x = curPosRoute.x;
        image.y = curPosRoute.y;
        image.smoothing = true;

        var line = new createjs.MovieClip();
        line.name = mcStartPoint.name + "_" + mcEndPoint.name;
        line.mcStartPoint = mcStartPoint;
        line.mcEndPoint = mcEndPoint;
        line.addChild(image);

        if (this.mcContainer.getChildByName(line.name) == null) {
            this.mcContainer.addChild(line);
            
            if (listCountPoint[mcStartPoint.name] == null) listCountPoint[mcStartPoint.name] = 1;
            else listCountPoint[mcStartPoint.name] += 1;
            
            if (listCountPoint[mcEndPoint.name] == null) listCountPoint[mcEndPoint.name] = 1;
            else listCountPoint[mcEndPoint.name] += 1;
            line.addEventListener("click", onRemoveLine);
        }
        
        mcStartPoint = mcEndPoint;
        mcEndPoint = null;
        showAbleRouteSelect();

        stage.update();
    }

    //lorderを実行
    lorder();
}

function getChildByName(mcList, name){
    var mc = new createjs.MovieClip();
    mcList.forEach(element => {
        if(element.name == name){
            mc = element;
        }
    });
    return mc;
}

function getChildByID(mcList, id){
    for (let index = 0; index < mcList.length; index++) {
        if(mcList[index].id == id){
            return mcList[index];
        }
    }
    return null;
}

function getRouteById(mcList, id) {
    for (let index = 0; index < mcList.length; index++) {
        if(mcList[index].id == id){
            return mcList[index];
        }
    }
    return null;
}

function getMapById(mcList, id) {
    for (let index = 0; index < mcList.length; index++) {
        if(mcList[index].id == id){
            return mcList[index];
        }
    }
    return null;
}

function getCurPosByIdDriver(driver, id) {
    for (var i = 0; i < driver.length; i++) {
        if (driver[i].id == id) {
            if ( driver[i].pos == "") continue;
            if ( driver[i].pos == "null") continue;
            if ( driver[i].pos == null) continue;
            var a = driver[i].pos.split("x");
            return {x:a[0], y:a[1]};
        }
    }
    return new Point();
}

function RealHitTest(object, point) {
    lpos = object.globalToLocal(point.x, point.y);
    console.log(stage.mouseInBounds);
    return !(stage.mouseInBounds && object.hitTest(lpos.x, lpos.y));
}

//Class
class Point{
    x;
    y;
}

class RouteVO{
    id;
    name;
    driver;
}

class MapVO{
    maps;
    count = 0;

    updateData(data) {
        this.maps = [];
        data.forEach(element => {
            var obj = new MapItemVO();
            obj.id = element.id;
            obj.name = element.name;
            obj.url = element.url;
            this.maps.push(obj);
        });
    }

    loadRoutedata() {
        this.maps.forEach(element => {
            this.count++;
            fetch(element.url)
            .then(function(resp) {
                return resp.json();
            })
            .then(function(data) {
                element.keys = [];
                data.key.forEach(element1 => {
                    var keyItem = new KeyVO();
                    keyItem.id = element1.id;
                    keyItem.name = element1.name;
                    element.keys.push(keyItem);
                });
                element.routes = [];
                data.routes.forEach(element2 => {
                    var routeItem = new RouteVO();
                    routeItem.id = element2.id;
                    routeItem.name = element2.name;
                    routeItem.driver = element2.driver;
                    element.routes.push(routeItem);
                });
            });
        });
    }

    getObjByID(id){
        var result;
        this.maps.forEach(element => {
            if(element.id == id){
                result = element;
            }
        });
        return result;
    }
}

class MapItemVO{
    id;
    name;
    url;
    keys;
    routes;
}

class KeyVO{
    id;
    name;
}

class DriverVO{
    listDriver;

    updateData(data) {
        this.listDriver = [];
        data.forEach(element => {
            var driver = new DriverItemVO();
            driver.id = element.id;
            driver.name = element.name;
            driver.url = element.url;
            this.listDriver.push(driver);
        });
    }

    getNameFolderbyDriverId(id) {
        this.listDriver.forEach(element => {
            if (element.id == id) {
                return element.name;
            }
        });
        return "";
    }
}

class DriverItemVO{
    id;
    name;
    url;
}
