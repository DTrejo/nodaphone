var canvas;

var delta = [0,0];
var stage = [window.screenX,window.screenY,window.innerWidth,window.innerHeight];
getBrowserDimensions();

var isRunning = false;
var isMouseDown = false;

var worldAABB;
var world;
var iterations = 1;
var timeStep = 1/25; 

var walls = new Array();
var wall_thickness = 200;
var wallsSetted = false;

var mouseJoint;
var mouseX = 0;
var mouseY = 0;

var mouseOnClick = new Array();

var timer = 0;

var elements = new Array();
var bodies = new Array();
var properties = new Array();

var gWebSearch;
var imFeelingLuckyMode = false;
var resultBodies = new Array();

init();

if (location.search != "")
{
	var params = location.search.substr(1).split("&")

	for (var i = 0; i < params.length; i++)
	{
		var param = params[i].split("=");

		if (param[0] == "q")
		{
			document.getElementById('q').value = param[1];
			run();
			break;
		}
	}
}

// GOOGLE API

function onLoad()
{
	gWebSearch = new GwebSearch();
	gWebSearch.setResultSetSize(GSearch.SMALL_RESULTSET);
	gWebSearch.setSearchCompleteCallback(null, onWebSearch);

	if (document.getElementById('q').value != '')
		search();
}

function onWebSearch()
{
	if(imFeelingLuckyMode)
	{
		location.href = gWebSearch.results[0].unescapedUrl;
		return;
	}
	
	for (var i = 0; i < gWebSearch.results.length; i++)
		addResult(gWebSearch.results[i]);
}

//

function init()
{
	canvas = document.getElementById('canvas');
	
	document.onmousedown = onDocumentMouseDown;
	document.onmouseup = onDocumentMouseUp;
	document.onmousemove = onDocumentMouseMove;
	document.ondblclick = onDocumentDoubleClick;
	
	document.onkeypress = onDocumentKeyPress;


	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('touchmove', onDocumentTouchMove, false);
	document.addEventListener('touchend', onDocumentTouchEnd, false)

	// init box2d
	
	worldAABB = new b2AABB();
	worldAABB.minVertex.Set(-200, -200);
	worldAABB.maxVertex.Set( screen.width + 200, screen.height + 200);

	world = new b2World(worldAABB, new b2Vec2(0, 0), true);
	
	// walls	
	setWalls();

	// Get box2d elements
	
	elements = getElementsByClass("box2d");
		
	for (i = 0; i < elements.length; i++) {

		var element = elements[i];
		properties[i] = findPos(element);
		properties[i][2] = element.offsetWidth;
		properties[i][3] = element.offsetHeight;
	}
	
	for (i = 0; i < elements.length; i++) {
		var element = elements[i];
		element.style.position = 'absolute';
		element.style.left = properties[i][0] + 'px';
		element.style.top = properties[i][1] + 'px';
		// element.style.backgroundColor = '#ffff00';
		element.onmousedown = onElementMouseDown;
		element.onmouseup = onElementMouseUp;
		element.onclick = onElementClick;
		
		bodies[i] = createBox(world, properties[i][0] + (properties[i][2] >> 1), properties[i][1] + (properties[i][3] >> 1), properties[i][2] / 2, properties[i][3] / 2, false);		
	}
}

function run() {

	isRunning = true;
	setInterval(loop, 25);	
}

//

function onDocumentMouseDown() {

	isMouseDown = true;
	return false;
}

function onDocumentMouseUp() {

	isMouseDown = false;
	return false;
}

function onDocumentMouseMove() {

	if (!isRunning)
		run();

	mouseX = window.event.clientX;
	mouseY = window.event.clientY;
}

function onDocumentDoubleClick() {

	reset();
}

function onDocumentKeyPress(event) {

	if (event.charCode == 13)
		search();
}

function onDocumentTouchStart( event ) {

	if(event.touches.length == 1) {

		event.preventDefault();

		if (!isRunning)
			run();

		// Faking double click for touch devices

		var now = new Date().getTime();

		if (now - timeOfLastTouch  < 250) {

			reset();
			return;
		}

		timeOfLastTouch = now;

		mouseX = event.touches[0].pageX;
		mouseY = event.touches[0].pageY;
		isMouseDown = true;
	}
}

function onDocumentTouchMove( event ) {

	if(event.touches.length == 1) {

		event.preventDefault();
		
		mouseX = event.touches[0].pageX;
		mouseY = event.touches[0].pageY;
	}
}

function onDocumentTouchEnd( event ) {

	if(event.touches.length == 0) {

		event.preventDefault();
		isMouseDown = false;
	}
}

//

function onElementMouseDown() {

	mouseOnClick[0] = window.event.clientX;
	mouseOnClick[1] = window.event.clientY;	
	return false;
}

function onElementMouseUp() {

	return false;
}

function onElementClick() {

	var range = 5;
	
	if (mouseOnClick[0] > window.event.clientX + range || mouseOnClick[0] < window.event.clientX - range && mouseOnClick[1] > window.event.clientY + range || mouseOnClick[1] < window.event.clientY - range)
		return false;
	
	if (this == document.getElementById('btnG')) search();
	if (this == document.getElementById('btnI')) imFeelingLucky();
	if (this == document.getElementById('q')) document.f.q.focus();
}

// API STUFF

function search() {

	if (!isRunning)
		run();
	
	onDocumentDoubleClick(); // clean
	gWebSearch.execute(document.getElementById('q').value);
	return false;
}

function imFeelingLucky() {

	imFeelingLuckyMode = true;
	gWebSearch.execute(document.getElementById('q').value);
	return false;	
}

function addResult(data) {

	var element = document.createElement('div');
	element.innerHTML = '<div><h3 class=r><a href="' + data.unescapedUrl + '" class=l onmousedown="return clk(this.href,\'\',\'\',\'res\',\'1\',\'&amp;sig2=3Ti89FTuSYfE6a-5k1jjKQ\')">' + data.title + '</a></h3><span style=display:inline-block><button class=w10 title="Promote"></button><button class=w20 title="Remove"></button></span><div class="s">' + data.content + '<br><cite>' + data.visibleUrl + '</cite></div>';
	
	canvas.appendChild(element);
	properties.push([Math.random() * (window.innerWidth / 2),-200,600,element.offsetHeight]);
	
	var i = properties.length - 1;

	element.style.position = 'absolute';
	element.style.left = 0 + 'px';
	element.style.top = -100 + 'px';
	element.style.backgroundColor = '#ffffff';
	element.onmousedown = onElementMouseDown;
	element.onmouseup = onElementMouseUp;
	element.onclick = onElementClick;

	elements[i] = element;

	resultBodies.push( bodies[i] = createBox(world, properties[i][0] + (properties[i][2] >> 1), properties[i][1] + (properties[i][3] >> 1), properties[i][2] / 2, properties[i][3] / 2, false, element) );
	
}

function reset() {

	for (i = 0; i < resultBodies.length; i++) {

		var body = resultBodies[i]
		canvas.removeChild( body.GetUserData().element );
		world.DestroyBody(body);
		body = null;
	}
	
	resultBodies = new Array();
}

//

function loop() {

	if (getBrowserDimensions())
		setWalls();

	delta[0] += (0 - delta[0]) * .5;
	delta[1] += (0 - delta[1]) * .5;
	
	world.m_gravity.x = 0 + delta[0];
	world.m_gravity.y = 350 + delta[1];

	mouseDrag();
	world.Step(timeStep, iterations);	
	
	for (i = 0; i < elements.length; i++) {

		var body = bodies[i];
		var element = elements[i];
		
		element.style.left = (body.m_position0.x - (properties[i][2] >> 1)) + 'px';
		element.style.top = (body.m_position0.y - (properties[i][3] >> 1)) + 'px';

		var rotationStyle = 'rotate(' + (body.m_rotation0 * 57.2957795) + 'deg)';

		element.style.WebkitTransform = rotationStyle;
		element.style.MozTransform = rotationStyle;
		element.style.OTransform = rotationStyle;
	}
}


// .. BOX2D UTILS

function createBox(world, x, y, width, height, fixed, element) {

	if (typeof(fixed) == 'undefined')
		fixed = true;

	var boxSd = new b2BoxDef();

	if (!fixed)
		boxSd.density = 1.0;

	boxSd.extents.Set(width, height);

	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x,y);
	boxBd.userData = {element: element};

	return world.CreateBody(boxBd)
}

function mouseDrag() {

	// mouse press
	if (isMouseDown && !mouseJoint) {

		var body = getBodyAtMouse();
		
		if (body) {

			var md = new b2MouseJointDef();
			md.body1 = world.m_groundBody;
			md.body2 = body;
			md.target.Set(mouseX, mouseY);
			md.maxForce = 30000.0 * body.m_mass;
			md.timeStep = timeStep;
			mouseJoint = world.CreateJoint(md);
			body.WakeUp();
		}
	}
	
	// mouse release
	if (!isMouseDown) {

		if (mouseJoint) {

			world.DestroyJoint(mouseJoint);
			mouseJoint = null;
		}
	}
	
	// mouse move
	if (mouseJoint) {

		var p2 = new b2Vec2(mouseX, mouseY);
		mouseJoint.SetTarget(p2);
	}
}

function getBodyAtMouse() {

	// Make a small box.
	var mousePVec = new b2Vec2();
	mousePVec.Set(mouseX, mouseY);
	
	var aabb = new b2AABB();
	aabb.minVertex.Set(mouseX - 1, mouseY - 1);
	aabb.maxVertex.Set(mouseX + 1, mouseY + 1);

	// Query the world for overlapping shapes.
	var k_maxCount = 10;
	var shapes = new Array();
	var count = world.Query(aabb, shapes, k_maxCount);
	var body = null;
	
	for (var i = 0; i < count; ++i) {

		if (shapes[i].m_body.IsStatic() == false) {

			if ( shapes[i].TestPoint(mousePVec) ) {

				body = shapes[i].m_body;
				break;
			}
		}
	}

	return body;
}

function setWalls() {

	if (wallsSetted) {

		world.DestroyBody(walls[0]);
		world.DestroyBody(walls[1]);
		world.DestroyBody(walls[2]);
		world.DestroyBody(walls[3]);
		
		walls[0] = null; 
		walls[1] = null;
		walls[2] = null;
		walls[3] = null;
	}
	
	walls[0] = createBox(world, stage[2] / 2, - wall_thickness, stage[2], wall_thickness);
	walls[1] = createBox(world, stage[2] / 2, stage[3] + wall_thickness, stage[2], wall_thickness);
	walls[2] = createBox(world, - wall_thickness, stage[3] / 2, wall_thickness, stage[3]);
	walls[3] = createBox(world, stage[2] + wall_thickness, stage[3] / 2, wall_thickness, stage[3]);	
	
	wallsSetted = true;
}

// .. UTILS

function getElementsByClass( searchClass ) {

	var classElements = new Array();
	var els = document.getElementsByTagName('*');
	var elsLen = els.length

	for (i = 0, j = 0; i < elsLen; i++) {

		var classes = els[i].className.split(' ');
		for (k = 0; k < classes.length; k++)
			if ( classes[k] == searchClass )
				classElements[j++] = els[i];
	}

	return classElements;
}

function findPos(obj) {

	var curleft = curtop = 0;

	if (obj.offsetParent) {

		do {

			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;

		} while (obj = obj.offsetParent);
	}

	return [curleft,curtop];
}

function getBrowserDimensions() {

	var changed = false;
		
	if (stage[0] != window.screenX) {

		delta[0] = (window.screenX - stage[0]) * 50;
		stage[0] = window.screenX;
		changed = true;
	}
	
	if (stage[1] != window.screenY) {

		delta[1] = (window.screenY - stage[1]) * 50;
		stage[1] = window.screenY;
		changed = true;
	}
	
	if (stage[2] != window.innerWidth) {

		stage[2] = window.innerWidth;
		changed = true;
	}
	
	if (stage[3] != window.innerHeight) {

		stage[3] = window.innerHeight;
		changed = true;
	}
	
	return changed;
}
