var lib, game, mcGame, mcMap, stage, content, frame, mcLine, coordList = [];
var mcContainer, rootX, rootY, spaceX, spaceY;
// Driver
var startPos;
var isChoose = true;
var listDriver = [];
var driverNameArray = ["motobike.png", "bike.png", "ship.png", "car.png", "plane.png", "train.png"];

// Setting
var btnNewRound, btnResetAll, btnCapture, btnGo, btnCome, btnZoomIn, btnZoomOut;

// App
var STATE = 0;
var curDriver = 4;
var mapVO;
var driverVO;

// Map
var container;
var selectObj;
var mcRoutes = [];
var mcCity = [];
var mcStartPoint;
var mcEndPoint;
var curPoint;
var curZoom = 0;
var isCapture = false;
var startCapture = false;
var dontDrag = false;
        
var WIDTH, HEIGHT;
var GAME_WIDTH, GAME_HEIGHT;

// Viet Nam
var curPosRoute;
var listCountPoint = [];
var isFirst = false;
var ratio;

function showGame(_lib, _game, _stage, _content, _frame, _gameWidth, _gameHeight){
    createjs.Touch.enable(_stage, false, true);
    _stage.preventSelection = false
    this.stage = _stage;
    this.content = _content;
    this.frame = _frame;
    this.lib = _lib;
    this.game = _game;
    this.mcGame = game.mcGame;
    this.mcMap = game.map;

    this.WIDTH = stage.width;
    this.HEIGHT = stage.height;
    this.GAME_WIDTH = _gameWidth;
    this.GAME_HEIGHT = _gameHeight;

    ratio = this.HEIGHT / this.GAME_HEIGHT;
    game.scaleX = game.scaleY = ratio;
    game.x = (this.WIDTH - this.GAME_WIDTH * ratio) / 2;

    var handleScroll = function (e) {
        if(e.wheelDelta < 0){
            if(this.curZoom <= 0) return;
            this.curZoom--;
        }else{
            if (this.curZoom == 30) return;
            this.curZoom++;
        }

        var delta = e.wheelDelta ? e.wheelDelta/1000 : e.detail ? -e.detail : 0;
        var p = game.globalToLocal(stage.mouseX, stage.mouseY);
        ratio = Math.max(0.0001, Math.min(game.scaleX + delta, 3));
        
        game.scaleX = game.scaleY = ratio;
        var p2 = game.globalToLocal(stage.mouseX, stage.mouseY);
        game.x += (p2.x - p.x) * ratio;
        game.y += (p2.y - p.y) * ratio;

        if (this.game.width < WIDTH) this.game.width = WIDTH;
        if (this.game.height < HEIGHT) this.game.height = HEIGHT;
        
        if(game.x > 0) game.x = 0;
        if(game.y > 0) game.y = 0;
        if(game.x + game.width < WIDTH) game.x = WIDTH - game.width;
        if(game.y + game.height < HEIGHT) game.y = HEIGHT - game.height;

        stage.update();
    }.bind(this);
    
    this.stage.canvas.addEventListener('DOMMouseScroll', handleScroll, false);
    this.stage.canvas.addEventListener('mousewheel', handleScroll, false);

    //init driver
    for (let index = 0; index < 6; index++) {
        let button = new Button({label:"", backing:frame.asset(driverNameArray[index]), }).loc(frame.width - 150, -25);
        button.on("click", function(e){
            if (isChoose) {
                isChoose = false;
                for (var i = 0; i < listDriver.length; i++) {
                    var mc = listDriver[i];
                    mc.visible = true;
                    mc.x = frame.width - 150;
                    mc.y = -25 + i * 45;
                    // mc.animate({x:frame.width - 150, y:-25 + i * 45}, i * 0.3, "backOut");
                    stage.update();
                }
            } else {
                isChoose = true;
                for (var i = 0; i < listDriver.length; i++) {
                    var mc = listDriver[i];
                    mc.x = frame.width - 150;
                    mc.y = -25;
                    mc.visible = false;
                    // mc.animate({x:850, y:-15}, 1, "backIn");
                    stage.update();
                }
                setSelectPos(index);
            }
        });
        listDriver.push(button);
    }

    //init button setting
    btnNewRound = new Button({label:"", backing:frame.asset("action1.png"), rollBacking:frame.asset("action1.png"), }).loc(-90, -25);
    btnNewRound.on("click", function(e){
        onNewRound();
    });
    btnCapture = new Button({label:"", backing:frame.asset("action2.png"), rollBacking:frame.asset("action2.png"), }).loc(-45, -25);
    btnCapture.on("click", function(e){
        enableDrag(false);
        selectObj = new Shape(WIDTH, HEIGHT).addTo().ble("difference");
        isCapture = true;
        showSettingButton(false);
        hideAllPointNotCapture();
        stage.update();
    });
    btnResetAll = new Button({label:"", backing:frame.asset("action3.png"), rollBacking:frame.asset("action3.png"), }).loc(0, -25);
    btnResetAll.on("click", function(e){
        onResetAll();
    });
    btnGo = new Button({label:"", backing:frame.asset("action4.png"), rollBacking:frame.asset("action4.png"), }).loc(45, -25);
    btnGo.on("click", function(e){
        onGo();
    });
    btnCome = new Button({label:"", backing:frame.asset("action5.png"), rollBacking:frame.asset("action5.png"), }).loc(90, -25);
    btnCome.on("click", function(e){
        onCome();
    });
    // btnZoomIn = new Button({label:"", backing:frame.asset("action6.png"), rollBacking:frame.asset("action6.png"), }).loc(270, -15);
    // btnZoomIn.on("click", function(e){
    //     if(curZoom == 50) return;
    //     curZoom++;
    //     content.sca(1 + (curZoom * 0.04));
    //     stage.update();
    // });
    // btnZoomOut = new Button({label:"", backing:frame.asset("action7.png"), rollBacking:frame.asset("action7.png"), }).loc(340, -15);
    // btnZoomOut.on("click", function(e){
    //     if(curZoom <= 0) return;
    //     curZoom--;
    //     content.sca(1 + (curZoom * 0.04));
    //     stage.update();
    // });

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
                    movie.isActive = false;
                    this.mcRoutes.push(movie);
                }
            }
        }
    });

    Object.entries(this.mcMap.mcCity).forEach(element => {
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

    mcContainer = new createjs.MovieClip();
    mcContainer.x = 5;
    mcContainer.y = -5;
    game.map.addChild(mcContainer);

    //Capture
	selectObj = new Shape(WIDTH, HEIGHT).addTo().ble("difference");
	let selectX = 0;
	let selectY = 0;
	let sel = null;
	content.on("mousedown", ()=>{
        if(!isCapture) return;
		selectX = frame.mouseX;
		selectY = frame.mouseY;
		selectObj.c();
		sel = null;
		stage.update();
	});
	content.on("pressmove", () => {
        if(!isCapture) return;
        this.startCapture = true;
        sel = [selectX, selectY, frame.mouseX - selectX, frame.mouseY - selectY];
        selectObj.c().s(red).ss(2).sd([10,10],5).dr(...sel);
		stage.update();
	});
    content.on("pressup", () => {
        if(!startCapture) return;
        startCapture = false;
        let oldPosX = game.x;
        let oldPosY = game.y;

        let p = game.globalToLocal(selectX, selectY);
        game.scaleX = game.scaleY = 1;
        let p2 = game.globalToLocal(selectX, selectY);
        game.x += (p2.x - p.x) * 1;
        game.y += (p2.y - p.y) * 1;
        let width = (frame.mouseX - selectX) / this.ratio;
        let height = (frame.mouseY - selectY) / this.ratio;
        sel = [selectX, selectY, width, height];

        let posNoteX = (width > 0 ? selectX : (selectX + width)) + width - 80;
        let posNoteY = (height > 0 ? selectY : selectY - height) + 5;
        let pic = frame.asset("note.png").clone().loc(posNoteX, posNoteY).addTo(content);

        selectObj.c().s(red).ss(2).sd([10,10],5).dr(...sel);
        let snap = content.cache(...sel).cacheCanvas;
        copy = new Bitmap(snap);
        content.uncache();
        // content.childrenToBitmap();
        selectObj.c();
        sel = null;
        const loader = new Loader();
        loader.save(copy);

        pic.removeFrom(content);
        game.scaleX = game.scaleY = ratio;
        game.x = oldPosX;
        game.y = oldPosY;

        showSettingButton(true);
        isCapture = false;
        enableDrag(true);
        stage.update();
    });
    
    this.setSelectPos(3);

    enableDrag(true);
}

var keyEvent;
function enableDrag(enable) {
    if(enable){
        game.drag({currentTarget:true});

        keyEvent = game.on("pressmove", () => {
            if(game.x > 0) game.x = 0;
            if(game.y > 0) game.y = 0;
            if(game.x + game.width < WIDTH) game.x = WIDTH - game.width;
            if(game.y + game.height < HEIGHT) game.y = HEIGHT - game.height;
        });
    }else{
        game.noDrag();

        game.off("pressmove", keyEvent);
    }
}

//Map
function resetSizeMap() {
    this.width = stage.stageWidth;
    this.height = stage.stageHeight;
    curZoom = 0;
    this.x = 0;
    this.y = 0;
}

//Function Driver
function setSelectPos(id) {
    for (let index = 0; index < listDriver.length; index++) {
        var driver = listDriver[index];
        if(id == index) driver.visible = true;
        else driver.visible = false;
    }
    this.curDriver = id + 1;
    // removeAllRoute();
    showAbleRouteSelect();
    mcStartPoint = null;
    mcEndPoint = null;
    // this.onResetAll();
}

//Function setting
function showSettingButton(show) {
    btnNewRound.visible = btnResetAll.visible = btnCapture.visible = btnCome.visible = btnGo.visible = show;
    for (let index = 0; index < this.listDriver.length; index++) {
        var driver = this.listDriver[index];
        if(show){
            if(this.curDriver == index + 1) driver.visible = show;
        }else{
            driver.visible = show;
        }
    }
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

function onNewRound() {
    if (isFirst && mcStartPoint && !mcEndPoint) {
        mcStartPoint.mcAnim.visible = false;
    }
    mcStartPoint = null;
    mcEndPoint = null;
    showAbleRouteSelect();

    this.onDisableNewRound();
    btnGo.alpha = 1;
    btnCome.alpha = 1;
    this.STATE = 0;
}

function onGo() {
    btnGo.alpha = 0.5;
    btnCome.alpha = 1;
    this.STATE = 1;
}

function onCome() {
    btnCome.alpha = 0.5;
    btnGo.alpha = 1;
    this.STATE = 2;
}

function onResetAll() {
    removeAllRoute();
    mcStartPoint = null;
    mcEndPoint = null;
    listCountPoint = [];
    for (var j = 0; j < mcRoutes.length; j++) {
        var movie = new createjs.MovieClip;
        movie = mcRoutes[j];
        movie.mcAnim.visible = false;
        movie.mouseChildren = movie.mouseEnabled = true;
        movie.mcPoint.alpha = 1;
        movie.isActive = false;
        movie.visible  = true;
    }
    
    for (var j = 0; j < mcCity.length; j++) {
        var movie = createjs.MovieClip;
        movie = mcCity[j];
        movie.visible  = true;
    }

    btnGo.alpha = 1;
    btnCome.alpha = 1;
    
    this.STATE = 0;
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
        console.log(this.STATE);
        if (this.STATE != 0) {
            this.loadGlobalPoint();
        }
        this.onEnableNewRound();
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

    console.log('abc');
    var curMap = getChildByID(this.mapVO.maps, country);
    var route = getChildByID(curMap.routes, id);
    if (route) {
        loadRouteImage(country, route);
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
        onDisableNewRound();
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
            if (movieCity) {
                movieCity.visible = movie.visible;
            }
        }
    }

    var route = getChildByName(this.mcRoutes, nameStartCountry + "_" + nameStartPoint);
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
        city = getChildByName(this.mcCity, route.name);
        route.visible = (alpha === 1) ? true : false;
        if(route.isActive) route.visible = true;
        if(city) city.visible = route.visible;
    });
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
                // movie.mcPoint.alpha = 1;
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
        zog("not driver");
        return;
    }
    curPosRoute = pos;
    var url =  "https://izitour.com/media/drawmap/res/assets/route/" + country + "/" + nameFolder + "/" + route.name;
    zog(url);

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

function hideAllPointNotCapture(){
    this.mcRoutes.forEach(element => {
        var movie = new createjs.MovieClip;
        movie = element;
        var movieCity = new createjs.MovieClip;
        movieCity = getChildByName(mcCity, movie.name);
        if (movie.isActive !== true) {
            movie.visible = false;
            if (movieCity) movieCity.visible = false;
        }
    });
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
