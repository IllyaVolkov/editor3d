import {Component, OnInit, HostListener} from '@angular/core';
import {Plane} from './Geometry/plane.model';
import {Cube} from './Geometry/cube.model';
const THREE = require( './lib/THREE.js');
//import * as THREE from 'three';
import * as $ from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'three.js editor demo';

  private container;
  private interval;
  private camera;
  private scene;
  private renderer;
  private projector;
  private plane;
  private cube;
  private linesMaterial;
  private color;
  private colors;
  private ray;
  private brush;
  private objectHovered;
  private mouse3D;
  private isMouseDown = false;
  private onMouseDownPosition;
  private radious;
  private theta;
  private onMouseDownTheta;
  private phi;
  private onMouseDownPhi;
  private isShiftDown;

  public constructor() {
    this.color = 0;
    this.colors = [ 0xDF1F1F, 0xDFAF1F, 0x80DF1F, 0x1FDF50, 0x1FDFDF, 0x1F4FDF, 0x7F1FDF, 0xDF1FAF, 0xEFEFEF, 0x303030 ];
    this.radious = 1600;
    this.theta = 45;
    this.onMouseDownTheta = 45;
    this.phi = 60;
    this.onMouseDownPhi = 60;
    this.isShiftDown = false;
  }

  ngOnInit() {
    this.init();
    this.render();
  }

  @HostListener('keydown', ['$event']) handleKeyDown(event: KeyboardEvent) {
    switch( event.keyCode ) {

      case 49: this.setBrushColor( 0 ); break;
      case 50: this.setBrushColor( 1 ); break;
      case 51: this.setBrushColor( 2 ); break;
      case 52: this.setBrushColor( 3 ); break;
      case 53: this.setBrushColor( 4 ); break;
      case 54: this.setBrushColor( 5 ); break;
      case 55: this.setBrushColor( 6 ); break;
      case 56: this.setBrushColor( 7 ); break;
      case 57: this.setBrushColor( 8 ); break;
      case 48: this.setBrushColor( 9 ); break;

      case 16: this.isShiftDown = true; this.interact(); this.render(); break;

      case 37: this.offsetScene( - 1, 0 ); break;
      case 38: this.offsetScene( 0, - 1 ); break;
      case 39: this.offsetScene( 1, 0 ); break;
      case 40: this.offsetScene( 0, 1 ); break;

    }
  }

  @HostListener('keyup', ['$event']) handleKeyUp(event: KeyboardEvent) {
    switch( event.keyCode ) {

      case 16: this.isShiftDown = false; this.interact(); this.render(); break;

    }
  }

  @HostListener('mousedown', ['$event']) handleMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.isMouseDown = true;

    this.onMouseDownTheta = this.theta;
    this.onMouseDownPhi = this.phi;
    this.onMouseDownPosition.x = event.clientX;
    this.onMouseDownPosition.y = event.clientY;
  }

  @HostListener('mousemove', ['$event']) handleMouseMove(event: MouseEvent) {
    event.preventDefault();

    if ( this.isMouseDown ) {

      this.theta = - ( ( event.clientX - this.onMouseDownPosition.x ) * 0.5 ) + this.onMouseDownTheta;
      this.phi = ( ( event.clientY - this.onMouseDownPosition.y ) * 0.5 ) + this.onMouseDownPhi;

      this.phi = Math.min( 180, Math.max( 0, this.phi ) );

      this.camera.position.x = this.radious * Math.sin( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
      this.camera.position.y = this.radious * Math.sin( this.phi * Math.PI / 360 );
      this.camera.position.z = this.radious * Math.cos( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
      this.camera.updateMatrix();

    }

    this.mouse3D = this.projector.unprojectVector( new THREE.Vector3( ( event.clientX / this.renderer.domElement.width ) * 2 - 1, - ( event.clientY / this.renderer.domElement.height ) * 2 + 1, 0.5 ), this.camera );
    this.ray.direction = this.mouse3D.subSelf( this.camera.position ).normalize();

    this.interact();
    this.render();

  }

  @HostListener('mouseup', ['$event']) handleMouseUp(event: MouseEvent) {
    event.preventDefault();

    this.isMouseDown = false;

    this.onMouseDownPosition.x = event.clientX - this.onMouseDownPosition.x;
    this.onMouseDownPosition.y = event.clientY - this.onMouseDownPosition.y;

    if ( this.onMouseDownPosition.length() > 5 ) {

      return;

    }

    var intersect, intersects = this.ray.intersectScene( this.scene );

    if ( intersects.length > 0 ) {

      intersect = intersects[ 0 ].object == this.brush ? intersects[ 1 ] : intersects[ 0 ];

      if ( intersect ) {

        if ( this.isShiftDown ) {

          if ( intersect.object != this.plane ) {

            this.scene.removeObject( intersect.object );

          }

        } else {

          var position = new THREE.Vector3().add( intersect.point, intersect.object.matrixRotation.transform( intersect.face.normal.clone() ) );

          var voxel = new THREE.Mesh( this.cube, new THREE.MeshColorFillMaterial( this.colors[ this.color ] ) );
          voxel.position.x = Math.floor( position.x / 50 ) * 50 + 25;
          voxel.position.y = Math.floor( position.y / 50 ) * 50 + 25;
          voxel.position.z = Math.floor( position.z / 50 ) * 50 + 25;
          voxel.overdraw = true;
          this.scene.addObject( voxel );

        }

      }

    }

    this.updateHash();
    this.interact();
    this.render();
  }

  @HostListener('wheel', ['$event']) handleWheel(event: WheelEvent) {
    this.radious -= event.wheelDeltaY;

    this.camera.position.x = this.radious * Math.sin( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
    this.camera.position.y = this.radious * Math.sin( this.phi * Math.PI / 360 );
    this.camera.position.z = this.radious * Math.cos( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
    this.camera.updateMatrix();

    this.interact();
    this.render();
  }

  private init() {

    this.container = document.createElement( 'div' );
    $('#scene').append( this.container );

    var info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '5px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = '<span style="color: #444; background-color: #fff; border-bottom: 1px solid #ddd; padding: 8px 10px; text-transform: uppercase;"><strong>0 - 9</strong>: colors, <strong>click</strong>: add voxel, <strong>shift + click</strong>: remove voxel, <strong>drag</strong>: rotate | <a id="link" href="" target="_blank">share</a> <a href="javascript:save();">save</a> <a href="javascript:clear();">clear</a></span>';
    this.container.append( info );

    this.camera = new THREE.Camera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    this.camera.position.x = this.radious * Math.sin( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
    this.camera.position.y = this.radious * Math.sin( this.phi * Math.PI / 360 );
    this.camera.position.z = this.radious * Math.cos( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );

    if (this.camera.target) {
      this.camera.target.position.y = 200;
    }

    this.scene = new THREE.Scene();

    // Grid

    var geometry = new THREE.Geometry();
    geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - 500, 0, 0 ) ) );
    geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 500, 0, 0 ) ) );

    this.linesMaterial = new THREE.LineColorMaterial( 0x000000, 0.2 );

    for ( var i = 0; i <= 20; i ++ ) {

      var line = new THREE.Line( geometry, this.linesMaterial );
      line.position.z = ( i * 50 ) - 500;
      this.scene.addObject( line );

      var line = new THREE.Line( geometry, this.linesMaterial );
      line.position.x = ( i * 50 ) - 500;
      line.rotation.y = 90 * Math.PI / 180;
      this.scene.addObject( line );

    }

    this.projector = new THREE.Projector();

    this.plane = new THREE.Mesh( new Plane( 1000, 1000 ) );
    this.plane.rotation.x = - 90 * Math.PI / 180;
    this.scene.addObject( this.plane );

    this.cube = new Cube( 50, 50, 50 );

    this.ray = new THREE.Ray( this.camera.position, null );

    this.brush = new THREE.Mesh( this.cube, new THREE.MeshColorFillMaterial( this.colors[ this.color ], 0.4 ) );
    this.brush.position.y = 2000;
    this.brush.overdraw = true;
    this.scene.addObject( this.brush );

    this.onMouseDownPosition = new THREE.Vector2();

    // Lights

    var ambientLight = new THREE.AmbientLight( 0x404040 );
    this.scene.addLight( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.x = 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = 0.75;
    directionalLight.position.normalize();
    this.scene.addLight( directionalLight );

    var directionalLight = new THREE.DirectionalLight( 0x808080 );
    directionalLight.position.x = - 1;
    directionalLight.position.y = 1;
    directionalLight.position.z = - 0.75;
    directionalLight.position.normalize();
    this.scene.addLight( directionalLight );

    this.renderer = new THREE.CanvasRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );

    this.container.appendChild(this.renderer.domElement);

    if ( window.location.hash ) {
      this.buildFromHash();
    }
  }

  setBrushColor( value ) {

    this.color = value;
    this.brush.material[ 0 ].color.setHex( this.colors[ this.color ] ^ 0x4C000000 );

    this.render();

  }

  buildFromHash() {

    var hash = window.location.hash.substr( 1 ),
      version = hash.substr( 0, 2 );

    if ( version == "A/" ) {

      var current = { x: 0, y: 0, z: 0, c: 0 }
      var data = this.decode( hash.substr( 2 ) );
      var i = 0, l = data.length;

      while ( i < l ) {

        var code = data[ i ++ ].toString( 2 );

        if ( code.charAt( 1 ) == "1" ) current.x += data[ i ++ ] - 32;
        if ( code.charAt( 2 ) == "1" ) current.y += data[ i ++ ] - 32;
        if ( code.charAt( 3 ) == "1" ) current.z += data[ i ++ ] - 32;
        if ( code.charAt( 4 ) == "1" ) current.c += data[ i ++ ] - 32;
        if ( code.charAt( 0 ) == "1" ) {

          var voxel = new THREE.Mesh( this.cube, new THREE.MeshColorFillMaterial( this.colors[ current.c ] ) );
          voxel.position.x = current.x * 50 + 25;
          voxel.position.y = current.y * 50 + 25;
          voxel.position.z = current.z * 50 + 25;
          voxel.overdraw = true;
          this.scene.addObject( voxel );

        }
      }

    } else {

      var data = this.decode( hash );

      for ( var i = 0; i < data.length; i += 4 ) {

        var voxel = new THREE.Mesh( this.cube, new THREE.MeshColorFillMaterial( this.colors[ data[ i + 3 ] ] ) );
        voxel.position.x = ( data[ i ] - 20 ) * 25;
        voxel.position.y = ( data[ i + 1 ] + 1 ) * 25;
        voxel.position.z = ( data[ i + 2 ] - 20 ) * 25;
        voxel.overdraw = true;
        this.scene.addObject( voxel );

      }

    }

    this.updateHash();

  }

  updateHash() {

    var data = [],
      current = { x: 0, y: 0, z: 0, c: 0 },
      last = { x: 0, y: 0, z: 0, c: 0 },
      code;

    for ( var i in this.scene.objects ) {

       let object = this.scene.objects[ i ];

      if ( object instanceof THREE.Mesh && object !== this.plane && object !== this.brush ) {

        current.x = ( object.position.x - 25 ) / 50;
        current.y = ( object.position.y - 25 ) / 50;
        current.z = ( object.position.z - 25 ) / 50;
        current.c = this.colors.indexOf( object.material[ 0 ].color.hex & 0xffffff );

        code = 0;

        if ( current.x != last.x ) code += 1000;
        if ( current.y != last.y ) code += 100;
        if ( current.z != last.z ) code += 10;
        if ( current.c != last.c ) code += 1;

        code += 10000;

        data.push( parseInt( code, 2 ) );

        if ( current.x != last.x ) {

          data.push( current.x - last.x + 32 );
          last.x = current.x;

        }

        if ( current.y != last.y ) {

          data.push( current.y - last.y + 32 );
          last.y = current.y;

        }

        if ( current.z != last.z ) {

          data.push( current.z - last.z + 32 );
          last.z = current.z;

        }

        if ( current.c != last.c ) {

          data.push( current.c - last.c + 32 );
          last.c = current.c;

        }

      }

    }

    let dataStr = this.encode( data );
    window.location.hash = "A/" + dataStr;
    $( '#link' ).href = "http://mrdoob.com/projects/voxels/#A/" + dataStr;

  }

  offsetScene( x, z ) {

    var offset = new THREE.Vector3( x, 0, z ).multiplyScalar( 50 );

    for ( var i in this.scene.objects ) {

      let object = this.scene.objects[ i ];

      if ( object instanceof THREE.Mesh && object !== this.plane && object !== this.brush ) {

        object.position.addSelf( offset );

      }

    }

    this.updateHash();
    this.interact();
    this.render();

  }

  interact() {

    if ( this.objectHovered ) {

      this.objectHovered.material[ 0 ].color.a = 1;
      this.objectHovered.material[ 0 ].color.updateStyleString();
      this.objectHovered = null;

    }

    var position, intersect, intersects = this.ray.intersectScene( this.scene );

    if ( intersects.length > 0 ) {

      intersect = intersects[ 0 ].object != this.brush ? intersects[ 0 ] : intersects[ 1 ];

      if ( intersect ) {

        if ( this.isShiftDown ) {

          if ( intersect.object != this.plane ) {

            this.objectHovered = intersect.object;
            this.objectHovered.material[ 0 ].color.a = 0.5;
            this.objectHovered.material[ 0 ].color.updateStyleString();

            return;

          }

        } else {

          position = new THREE.Vector3().add( intersect.point, intersect.object.matrixRotation.transform( intersect.face.normal.clone() ) );

          this.brush.position.x = Math.floor( position.x / 50 ) * 50 + 25;
          this.brush.position.y = Math.floor( position.y / 50 ) * 50 + 25;
          this.brush.position.z = Math.floor( position.z / 50 ) * 50 + 25;

          return;

        }

      }

    }

    this.brush.position.y = 2000;

  }

  render() {

    this.renderer.render( this.scene, this.camera );

  }

  save() {

    this.linesMaterial.color.setRGBA( 0, 0, 0, 0 );
    this.brush.position.y = 2000;
    this.render();

    window.open( this.renderer.domElement.toDataURL('image/png'), 'mywindow' );

    this.linesMaterial.color.setRGBA( 0, 0, 0, 0.2 );
    this.render();

  }

  clear() {

    if ( !confirm( 'Are you sure?' ) ) {

      return

    }

    window.location.hash = "";

    var i = 0;

    while ( i < this.scene.objects.length ) {

      let object = this.scene.objects[ i ];

      if ( object instanceof THREE.Mesh && object !== this.plane && object !== this.brush ) {

        this.scene.removeObject( object );
        continue;
      }

      i ++;
    }

    this.updateHash();
    this.render();

  }

  // https://gist.github.com/665235

  decode( string ) {

    var output = [];
    string.split('').forEach( function ( v ) { output.push( "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf( v ) ); } );
    return output;

  }

  encode( array ) {

    var output = "";
    array.forEach( function ( v ) { output += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt( v ); } );
    return output;

  }

}
