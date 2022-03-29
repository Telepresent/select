//IMPORTS
import $ from "jquery";

//THREE
import * as THREE from "three";

//Outline Pass Support
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

//Path Line Support
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

//Orbit Controls
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//Tweening
import { gsap } from "gsap";

//GLOBAL VARIABLES ----------------------------------------------------------------
var scene, renderer, camera, controls;

var composer, effectFXAA, outlinePass;

var bldgs = [];

function building(x1, y1, x2, y2, x3, y3, x4, y4, id, height) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.x3 = x3;
  this.y3 = y3;
  this.x4 = x4;
  this.y4 = y4;
  this.id = id;
  this.height = height;
}

var geoData = [];
let sprite;

var sca = 5000; //Scaler for map coordinates

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//Setup ThreeJS Scene
scene = new THREE.Scene();
  //scene.fog = new THREE.Fog("#E4E4EE", 0, 100);
  scene.fog = new THREE.FogExp2("#E4E4EE", 0.01);
let guiScene = new THREE.Scene();

camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
); //FOV, Aspect Ratio, Close Plane, Far Plane

camera.position.z = 10;
camera.position.y = 5;
camera.rotation.x = -Math.PI / 14;

renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor("#E4E4EE");
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
  let maxZoomDist = 100;
  let minZoomDist = 20;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = 1.5;
  controls.panSpeed = 1.8;
  controls.enableKeys = true;
  controls.rotateSpeed = 0.3;
  controls.zoomSpeed = 2;
  controls.minDistance = minZoomDist;
  controls.maxDistance = maxZoomDist;

var ambientLight = new THREE.AmbientLight(0xACB0CD, 0.6);
  scene.add(ambientLight);

var ambientLight2 = new THREE.AmbientLight(0xACB0CD, 0.8);
  guiScene.add(ambientLight2);

var dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
  dirLight2.position.set(-15, 30, -15);
  guiScene.add(dirLight2);

var dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-15, 30, -15);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 500;
  dirLight.shadow.camera.bottom = -500;
  dirLight.shadow.camera.left = -500;
  dirLight.shadow.camera.right = 500;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.mapSize.width = 10000;
  dirLight.shadow.mapSize.height = 10000;
  scene.add(dirLight);

// var light = new THREE.PointLight(0xffffff, 0.2, 1000);
//   light.position.set(-3, 6, -3);
//   scene.add(light);

var material = new THREE.MeshLambertMaterial({ color: 0xffffff });
var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x01EFFE });
var selBldgMat = new THREE.MeshLambertMaterial( { opacity: 0.25, transparent: true, color: 0x01EFFE, side: THREE.BackSide } );
var groundMaterial = new THREE.MeshLambertMaterial({ color: 0xE4E4EE });
var parkMaterial = new THREE.MeshLambertMaterial({ color: 0xE6ffE6 });

//PostProcessing
composer = new EffectComposer( renderer );

var renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );

outlinePass = new OutlinePass(new THREE.Vector2(
  window.innerWidth, window.innerHeight
  ), scene, camera);
  outlinePass.edgeStrength = 15;
  outlinePass.edgeThickness = 1;
  //outlinePass.pulsePeriod = 5;
  outlinePass.visibleEdgeColor.set(0x3EB8FE);
  outlinePass.hiddenEdgeColor.set(0x0078AD);
  outlinePass.overlayMaterial.blending = THREE.NormalBlending;
  composer.addPass( outlinePass );

let outlinePass2 = new OutlinePass(new THREE.Vector2(
    window.innerWidth, window.innerHeight
    ), scene, camera);
    outlinePass2.edgeStrength = 15;
    outlinePass2.edgeThickness = 3;
    outlinePass2.pulsePeriod = 5;
    outlinePass2.visibleEdgeColor.set(0xff0000);
    outlinePass2.hiddenEdgeColor.set(0x153644);
    outlinePass2.overlayMaterial.blending = THREE.NormalBlending;
    composer.addPass( outlinePass2 );



effectFXAA = new ShaderPass( FXAAShader );
  effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  effectFXAA.renderToScreen = true;
  composer.addPass(effectFXAA);

//INIT ----------------------------------------------------------------------------
function init() {
  //Load GeoJSON Data
  $.getJSON("/src/json/cityTest.json", function(result) {
    //console.log("JSON load begun");
    //console.log(result.features[0].geometry.coordinates);
    geoData = result.features[0].geometry.coordinates;
    //console.log(geoData.length);
  })
    .done(function() {
      setup();
    })
}

function setup() {
  //Place floorplane
  var floorPlane = new THREE.PlaneGeometry(1000, 1000);
    floorPlane.computeFaceNormals();

  var floorPlaneMesh = new THREE.Mesh(floorPlane, groundMaterial);
    floorPlaneMesh.name = "floor";
    floorPlaneMesh.receiveShadow = true;
    floorPlaneMesh.rotateX(Math.PI / -2);
    scene.add(floorPlaneMesh);
    
  var spriteMap = new THREE.TextureLoader().load( "/src/DotSpriteTransparent.png" );
  var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap } );
    spriteMaterial.depthTest = false;
  sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(1,1,1);
    sprite.position.set(0,5,0);
    sprite.renderOrder = 999;
    //scene.add( sprite );

  //Fill bldgs array
  for (var i = 0; i < geoData.length; i++) {
    var c1, c2, c3, c4, c5, c6, c7, c8;

    //Add foundation coordinates from JSON info
    c1 = geoData[i][0][0][0] * sca;
    c2 = geoData[i][0][0][1] * sca;
    c3 = geoData[i][0][1][0] * sca;
    c4 = geoData[i][0][1][1] * sca;
    c5 = geoData[i][0][2][0] * sca;
    c6 = geoData[i][0][2][1] * sca;
    c7 = geoData[i][0][3][0] * sca;
    c8 = geoData[i][0][3][1] * sca;
    var newBld = new building(c1, c2, c3, c4, c5, c6, c7, c8, "test", 0.1);

    //Add building to buildings array and send the info to the addBuilding function
    bldgs.push(newBld);
    addBuilding(newBld, i);
  }

  //add sprites & lines
  let addTo = [];
  let pathBldgs = [];
  let pathBldsGUI = [];
  let floors = [];
  let pathGeometry = [];
  for (let i = 0; i < 5; i++){
    let found = false;
    while (!found) {
      let numb = Math.floor(getRndNum(0, geoData.length));
      if (!addTo.includes(numb)){
        found = true;
        addTo.push(numb);
      } else {
        found = false;
      }
    }
    let tempTarget = scene.getObjectByName( `bldg${addTo[i]}` );
    //console.log(tempTarget);
    pathBldgs.push(tempTarget);

    let v = tempTarget.geometry.vertices;

    let bld = addFloor(v,i);
    var invertedBld = new THREE.Mesh(bld, selBldgMat);
    invertedBld.scale.y = tempTarget.scale.y;
    guiScene.add(invertedBld);
    invertedBld.position.y = 0.001;
    

    //console.log(`${addTo[i]} height: ${tempTarget.scale.y}`);

    let floor = new THREE.Mesh(bld, floorMaterial);
    guiScene.add(floor);
    floor.scale.y = 0.25;
    floor.position.y = getRndNum(0, tempTarget.scale.y-0.5);
    floors.push(floor);

    let cX = (v[0].x + v[1].x + v[2].x + v[3].x) / 4;
    let cZ = (v[0].z + v[1].z + v[2].z + v[3].z) / 4;

    let nSprite = sprite.clone();
    guiScene.add( nSprite );
    nSprite.position.set( cX, tempTarget.scale.y+1, cZ );
    pathGeometry.push( cX, tempTarget.scale.y+1, cZ );
  }
  var lineGeo = new LineGeometry();
  lineGeo.setPositions( pathGeometry );
  let lineMat = new LineMaterial({
    color: 0xed2114,
    linewidth: 0.01,
    dashed: false
  });
  lineMat.depthTest = false;
  let line = new Line2( lineGeo, lineMat);
    line.scale.set( 1, 1, 1 );
    line.renderOrder = 2;
    guiScene.add( line );
    outlinePass.selectedObjects = pathBldgs;
}

function addFloor(v, index){
  var geometry = new THREE.Geometry();

    geometry.vertices.push(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);

    geometry.faces.push(
      //Base
      new THREE.Face3(2, 1, 0),
      new THREE.Face3(3, 2, 0),

      //Top
      new THREE.Face3(7, 5, 6),
      new THREE.Face3(4, 5, 7),
      //Front
      new THREE.Face3(3, 6, 2),
      new THREE.Face3(7, 6, 3),
      //Back
      new THREE.Face3(1, 4, 0),
      new THREE.Face3(5, 4, 1),
      //Left
      new THREE.Face3(4, 7, 3),
      new THREE.Face3(3, 0, 4),
      //Right
      new THREE.Face3(6, 5, 1),
      new THREE.Face3(6, 1, 2)
    );

    geometry.computeFaceNormals();
    geometry.name = String("flo" + index);

  
  return (geometry);
}

//Takes in max and min, returns a number between them
function getRndNum(min, max) {
  return Math.random() * (max - min) + min;
}

//Adds the specified building to the Three scene by creating custom geometry
function addBuilding(bld, numb) {
  //Create geometry of custom foundation
  var geometry = new THREE.Geometry();

  geometry.vertices.push(
    //Floor
    new THREE.Vector3(bldgs[numb].x1, 0, bldgs[numb].y1), //0
    new THREE.Vector3(bldgs[numb].x2, 0, bldgs[numb].y2), //1
    new THREE.Vector3(bldgs[numb].x3, 0, bldgs[numb].y3), //2
    new THREE.Vector3(bldgs[numb].x4, 0, bldgs[numb].y4), //3

    //Ceiling (Given starting height so they all scale the same)
    new THREE.Vector3(bldgs[numb].x1, 1, bldgs[numb].y1), //4
    new THREE.Vector3(bldgs[numb].x2, 1, bldgs[numb].y2), //5
    new THREE.Vector3(bldgs[numb].x3, 1, bldgs[numb].y3), //6
    new THREE.Vector3(bldgs[numb].x4, 1, bldgs[numb].y4) //7
  );

  geometry.faces.push(
    //Base (Don't see it: doesn't need to be shown)
    //new THREE.Face3(2, 1, 0),
    //new THREE.Face3(3, 2, 0),

    //Top
    new THREE.Face3(7, 5, 6),
    new THREE.Face3(4, 5, 7),
    //Front
    new THREE.Face3(3, 6, 2),
    new THREE.Face3(7, 6, 3),
    //Back
    new THREE.Face3(1, 4, 0),
    new THREE.Face3(5, 4, 1),
    //Left
    new THREE.Face3(4, 7, 3),
    new THREE.Face3(3, 0, 4),
    //Right
    new THREE.Face3(6, 5, 1),
    new THREE.Face3(6, 1, 2)
  );

  geometry.computeFaceNormals();

  geometry.name = String("bldg" + numb);

  var newBldg = new THREE.Mesh(geometry, material);
  newBldg.name = String("bldg" + numb);

  newBldg.receiveShadow = true;
  newBldg.castShadow = true;

  scene.add(newBldg);

  //Scale AFTER adding, so they all scale the same
  newBldg.scale.y = Math.ceil(getRndNum(1, 4) - 0.5);
}

function animate() {
  requestAnimationFrame(animate);
  update();
  render();
}

function render() {
  renderer.clear();
  //renderer.render( scene, camera );
  composer.render( scene, camera );
  renderer.clearDepth();
  renderer.render( guiScene, camera );
}


function update() {
  controls.update();
}

//MOUSEMOVE FUNCTION -------------------------------------------------------------
//window.addEventListener("click", onMouseClick);

window.addEventListener("mousedown", mouseDown);
window.addEventListener("mouseup", mouseUp);

let lastMouseDown;
function mouseDown(event){
  lastMouseDown = {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1
  }
}

function mouseUp(event) {
  event.preventDefault();
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  let distDownToUp = Math.hypot((mouse.x - lastMouseDown.x), (mouse.y - lastMouseDown.y));

  //If user meant to click 
  if (distDownToUp < 0.08) {
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length !== 0) {
      if (intersects[0].object.name !== "floor") {
        let targetVertices = intersects[0].object.geometry.vertices;

        let cX = (targetVertices[0].x + targetVertices[1].x + targetVertices[2].x + targetVertices[3].x) / 4;
        let cZ = (targetVertices[0].z + targetVertices[1].z + targetVertices[2].z + targetVertices[3].z) / 4; 

        let target = intersects[0].object;
        // (event.which === 1) ?
        // outlinePass.selectedObjects = [target] :
        // outlinePass2.selectedObjects = [target]; 

        let focusPoint = new THREE.Vector3(cX, intersects[0].point.y, cZ);

        let tl = gsap.timeline({defaults: {duration: 0.25, ease: "power1.inOut"}});
        //Move camera target
        tl.to(controls.target, {
          x: focusPoint.x,
          y: focusPoint.y,
          z: focusPoint.z
        }, 0);
      
        //Get current zoom level
        let curZoom = focusPoint.distanceTo( controls.object.position );
        
        //Set outer bound of controls to current zoom level
        controls.maxDistance = curZoom;

        tl.to(controls, {
          maxDistance: 20,
          onComplete: resetZoom
        }, 0);

        function resetZoom(){
          controls.maxDistance = maxZoomDist;
        }
      } else {
        //outlinePass.selectedObjects = [];
      }

    }
  }
}

//WINDOW RESIZE --------------------------------------------------------------------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();
  //controls.update();
});

//RUN -----------------------------------------------------------------------------
init();
animate();
