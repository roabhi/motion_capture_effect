/*=================================================
GLOBAL VARS
=================================================== */

const holder = document.getElementById('holder'),
      controls = document.getElementById('controls'),
      canvas = document.getElementById('canvas'),
      ctx = canvas.getContext('2d');

let   can_w = parseInt(canvas.getAttribute('width')),
      can_h = parseInt(canvas.getAttribute('height')),
      can_bg_color = '#000000',
      line_color =  {
        r: 150, //207
        g: 150, //255
        b: 150 //4
      },
      lines_opacity = 1,
      ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      alpha: 1, //1
      phase: 0 //0
    },
    ball_color = {
       r: 255, //207
       g: 255, //255
       b: 255 //4
    },
    R = 3, //otiginal is 2 --> size of points
    balls = [],
    alpha_f = 0.03, // 0.03
    alpha_phase = 0, // 0
    // Line
    link_line_width = 1.25, //0.8
    dis_limit = 500, //original is 260 --> Distance tolerance between lines connection. The greater the farsest. The less balls the greater the distance as well
    add_mouse_point = true,
    mouse_in = false,
    mouse_ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      type: 'mouse'
    },
    current_balls, //Creaste a var to hold a reference for the present balls when those are paused
    balls_number = 10, //Var to hold a reference for the amount of inital balls
    myActiveBall, //Create a var to hold a reference for the most nearest ball when mouse down
    isBallActive, //Create a var to hold a boolean to keep track of the state of active balls
    myAnim, //Create a var to hold a reference for the animation frame
    isAnim, //Create a var to hold a reference to keep track of the animation status
    isShape, //Create a var to hold a reference to keep the track if we are requesting a shape
    hasDir, //Create a var to hold a ference to keep track of the direction where moving
    globalResizeTimeout, //Create a var to hold a reference for the global resizer event
    globalResEvent; //Create a var to hold a reference for the global resizer event



/*=================================================
UTILS FUNCTIONS
=================================================== */

function globalResizeThrottler() {
    // ignore resize events as long as an actual ResizeHandler execution is in the queue
    if ( !globalResizeTimeout ) {
      globalResizeTimeout = setTimeout(function() {
        globalResizeTimeout = null;
        resizer();
       // The resizer() will execute at a rate of 15fps and will auto destroy each time after
       }, 66);
    }
} //Function that limits the amount of times the resize event is actually fir to prevent poor performance



function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/*=================================================
UX FUNCTIONS
=================================================== */

function addInteractions() {


  /* INIT DEFAULT VALUES
  =================================================== */


  //Set canvas bg color / color picker and actual canvas
  document.getElementById('canvas-bg-color').setAttribute('value', can_bg_color);
  holder.style.background = can_bg_color + ' none';

  //Set points Color / color picker based on ball_color values from JS
  document.getElementById('balls-bg-color').setAttribute('value', rgbToHex(ball_color.r,ball_color.g,ball_color.b));

  //Set lines color / color picker based on line_color values from JS
  document.getElementById('lines-bg-color').setAttribute('value', rgbToHex(line_color.r, line_color.g, line_color.b));

  //Set lines alpha based on lines_opacity value form JS * 10 (needs to be a multiple of ten)
  document.getElementById('lines-alpha-range').setAttribute('value', lines_opacity * 10);

  //Set lines proximity range based on dis_limit from JS
  document.getElementById('lines-prox-range').setAttribute('value', dis_limit);




  controls.addEventListener('click', (e) => {

    switch (e.target.className) {
      case "play":

          if(isAnim) {
            isAnim = false; //Cancellation of anim takes place in render itself



          }else {
            isAnim = true;
            //myAnim = window.requestAnimationFrame(render);
          }



        break;
      case "add":
        balls_number++;
        addBallIfy();
      break;
      case "remove":
        if(balls_number >= 1) {
          balls_number--;
          removeBallIfy();
        }

      break;
      default:
      null;

    }

  });

  canvas.addEventListener('mouseenter', (e) => {
    console.log('mouseenter');
    mouse_in = true;
    balls.push(mouse_ball);
  });

  canvas.addEventListener('mousedown', (e) => {

    current_balls = balls.filter( b => !b.hasOwnProperty('type'));


    current_balls.forEach((el,i) => {

          let mouse_x = e.clientX,
          mouse_y = e.clientY;

      //Detect if click is inside any of the current balls

      if(Math.pow(mouse_x-el.x,2) + Math.pow(mouse_y-el.y,2) < Math.pow(5,2) ) {

        if (typeof console != 'undefined') {
            console.log(' ball is active ');
        }

        myActiveBall = el;

        isBallActive = true;
      }else {

        if (typeof console != 'undefined') {
            console.log(' ball is NOT active ');
        }

      }


    });







  });

  canvas.addEventListener('mouseup', (e) => {
    console.log('mouseup');
    myActiveBall = null;
    isBallActive = false;

  });




  canvas.addEventListener('mouseleave', (e) => {
    console.log('mouseleave');
    mouse_in = false;
    let new_balls = [];
    Array.prototype.forEach.call(balls, function(b){
        if(!b.hasOwnProperty('type')){
            new_balls.push(b);
        }
    });
    balls = new_balls.slice(0);
  });


  canvas.addEventListener('mousemove', (e) => {
    let ev = e || window.event;
    mouse_ball.x = ev.pageX;
    mouse_ball.y = ev.pageY;


    canvas.style.cursor = 'default'; // cursor is default by default

    current_balls = balls.filter( b => !b.hasOwnProperty('type')); //Filter only balls and not he mouse


    current_balls.forEach((el,i) => {

      if(Math.pow(mouse_ball.x - el.x,2) + Math.pow(mouse_ball.y - el.y,2) <= Math.pow(5,2) ) {
        canvas.style.cursor = 'pointer';
      } //If cursor is hovering any ball

    }); //Loop through current balls, excliding the mouse as ball itself


    if(isBallActive) { //In addtion if there is any ball active...move the ball where the cursor goes until mouse up

      myActiveBall.x = mouse_ball.x;
      myActiveBall.y = mouse_ball.y;
    }

  });


  /* LISTEN 4 UX EVENTS
  =================================================== */

  Array.from(document.querySelectorAll('div#settings div.centered input')).map(_obj => {

    _obj.addEventListener('change', e => {

      switch (e.target.id) {
        case 'canvas-bg-color':
          holder.style.background = e.target.value + ' none';
        break;
        case 'balls-bg-color':

          let _result_b = hexToRgb(e.target.value);

          ball_color = {
             r: _result_b.r,
             g: _result_b.g,
             b: _result_b.b
          }

        break;
        case 'lines-bg-color':

          let _result_l = hexToRgb(e.target.value);

          line_color = {
            r: _result_l.r,
            g: _result_l.g,
            b: _result_l.b
          }

        break;
        case 'lines-alpha-range':

          lines_opacity = e.target.value / 10;

        break;
        case 'lines-prox-range':

          dis_limit = e.target.value;

        break;
        default:

      }

    });

  });

  // canvasBgColorPicker.addEventListener('change', e => {
  //
  //   if (typeof console != 'undefined') {
  //       console.log(e.target.value);
  //   }
  //
  //   holder.style.background = e.target.value + ' none';
  //
  //
  // });



}

function getRandomSpeed(pos){
    let min = -1, //-1
        max = 1; //1

    switch(pos){
        case 'top':
            return [randomNumFrom(min, max), randomNumFrom(0.1, max)];
            break;
        case 'right':
            return [randomNumFrom(min, -0.1), randomNumFrom(min, max)];
            break;
        case 'bottom':
            return [randomNumFrom(min, max), randomNumFrom(min, -0.1)];
            break;
        case 'left':
            return [randomNumFrom(0.1, max), randomNumFrom(min, max)];
            break;
        default:
            return;
            break;
    }
}

function randomArrayItem(arr){
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumFrom(min, max){
    return Math.random()*(max - min) + min;
}

function getRandomBall(){

    if(isAnim) { //If animation is on get balls at random position and speed either inseide or outside boundaries

      let pos = randomArrayItem(['top', 'right', 'bottom', 'left']);
      switch(pos){
          case 'top':
              return {
                  x: randomSidePos(can_w),
                  y: -R,
                  vx: getRandomSpeed('top')[0],
                  vy: getRandomSpeed('top')[1],
                  r: R,
                  alpha: 1,
                  phase: randomNumFrom(0, 10)
              }
              break;
          case 'right':
              return {
                  x: can_w + R,
                  y: randomSidePos(can_h),
                  vx: getRandomSpeed('right')[0],
                  vy: getRandomSpeed('right')[1],
                  r: R,
                  alpha: 1,
                  phase: randomNumFrom(0, 10)
              }
              break;
          case 'bottom':
              return {
                  x: randomSidePos(can_w),
                  y: can_h + R,
                  vx: getRandomSpeed('bottom')[0],
                  vy: getRandomSpeed('bottom')[1],
                  r: R,
                  alpha: 1,
                  phase: randomNumFrom(0, 10)
              }
              break;
          case 'left':
              return {
                  x: -R,
                  y: randomSidePos(can_h),
                  vx: getRandomSpeed('left')[0],
                  vy: getRandomSpeed('left')[1],
                  r: R,
                  alpha: 1,
                  phase: randomNumFrom(0, 10)
              }
              break;
      }

    }else { //Otherwise...get a new ball wihtin the boundaries of canvas wihtin a safe zone of -100 px so it is visible to the user
      return {
          x: randomNumFrom(0,can_w - 100),
          y: randomNumFrom(0,can_h - 100),
          vx: getRandomSpeed('top')[0],
          vy: getRandomSpeed('top')[1],
          r: R,
          alpha: 1,
          phase: randomNumFrom(0, 10)
      }
    }
}
function randomSidePos(length){
    return Math.ceil(Math.random() * length);
}

// Draw Ball
function renderBalls(){
    Array.prototype.forEach.call(balls, function(b){
       if(!b.hasOwnProperty('type')){
           ctx.fillStyle = 'rgba('+ball_color.r+','+ball_color.g+','+ball_color.b+','+b.alpha+')';
           ctx.beginPath();
           ctx.arc(b.x, b.y, R, 0, Math.PI*2, true);
           ctx.closePath();
           ctx.fill();
       }
    });
}

function defineBalls() {
  Array.prototype.forEach.call(balls, function(b){
     if(!b.hasOwnProperty('type')){
         ctx.fillStyle = 'rgba('+ball_color.r+','+ball_color.g+','+ball_color.b+',1)';
         ctx.beginPath();
         ctx.arc(b.x, b.y, R, 0, Math.PI*2, true);
         ctx.closePath();
         ctx.fill();
     }
  });
}

// Update balls
function updateBalls(){
  let new_balls = [];

  Array.prototype.forEach.call(balls, function(b){
      b.x += b.vx;
      b.y += b.vy;

      if(b.x > -(5) && b.x < (can_w+5) && b.y > -(5) && b.y < (can_h+5)){ //50
         new_balls.push(b);
      }

      // alpha change
      b.phase += alpha_f;
      b.alpha = Math.abs(Math.cos(b.phase));
      // console.log(b.alpha);
  });

  balls = new_balls.slice(0);

}

function defineBallsPos(){

  // if(isBallActive) {
  //   myActiveBall.x =
  // }

}

// loop alpha
function loopAlphaInf(){

}

// Draw lines
function renderLines(){
    let fraction, alpha;
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {

           fraction = getDisOf(balls[i], balls[j]) / dis_limit;

           if(fraction < 1){
              alpha = (1 - fraction).toString();
               //alpha = (1 - fraction / lines_opacity).toString();

               //ctx.strokeStyle = 'rgba('+line_color.r+','+line_color.g+','+line_color.b+','+alpha+')';
               ctx.strokeStyle = 'rgba('+line_color.r+','+line_color.g+','+line_color.b+','+alpha+')';

               ctx.lineWidth = link_line_width;

               ctx.beginPath();
               ctx.moveTo(balls[i].x, balls[i].y);
               ctx.lineTo(balls[j].x, balls[j].y);
               ctx.stroke();
               ctx.closePath();
           }
        }
    }
}

function defineLines() {
  let fraction, alpha, current_balls;

  current_balls = balls.filter(b => !b.hasOwnProperty('type'));

  for (let i = 0; i < current_balls.length; i++) {
      for (let j = i + 1; j < current_balls.length; j++) {

         fraction = getDisOf(balls[i], balls[j]) / dis_limit ;

         if(fraction < 1){
             alpha = (1 - fraction).toString();

             //ctx.strokeStyle = 'rgba(150,150,150,.25)';
             ctx.strokeStyle = 'rgba('+line_color.r+','+line_color.g+','+line_color.b+','+lines_opacity+')';
             ctx.lineWidth = link_line_width;

             ctx.beginPath();
             ctx.moveTo(current_balls[i].x, current_balls[i].y);
             ctx.lineTo(current_balls[j].x, current_balls[j].y);
             ctx.stroke();
             ctx.closePath();
         }
      }
  }
}

// calculate distance between two points
function getDisOf(b1, b2){
    let delta_x = Math.abs(b1.x - b2.x),
        delta_y = Math.abs(b1.y - b2.y);

    return Math.sqrt(delta_x*delta_x + delta_y*delta_y);
}

// add balls if there a little balls
function addBallIfy(){
    if(balls.length < balls_number){ //Default is 20 --> Keeps constant flow of balls if below value
        balls.push(getRandomBall());
    }
}

function removeBallIfy() {
  if(balls.length >= balls_number){ //Default is 20 --> Keeps constant flow of balls if below value
      balls.pop();
      if (typeof console != 'undefined') {
          console.log(' balls is ', balls);
      }
  }

}

// Render
function render(){

    ctx.clearRect(0, 0, can_w, can_h);



    if(isAnim) {
      R = 3; //Whwn anim is on ball size is 3

      renderBalls();

      renderLines();

      updateBalls();

      addBallIfy();

    }else {


      R = 4; //When anim is off ball size increases to 4
      defineLines();
      defineBalls();
      defineBallsPos();


    }

    window.requestAnimationFrame(render);


}

// Init Balls
function initBalls(num){
    for(let i = 1; i <= num; i++){
        balls.push({
            x: randomSidePos(can_w),
            y: randomSidePos(can_h),
            vx: getRandomSpeed('top')[0],
            vy: getRandomSpeed('top')[1],
            r: R,
            alpha: 1,
            phase: randomNumFrom(0, 10)
        });
    }
}
// Init Canvas
function initCanvas(){
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);

    can_w = parseInt(canvas.getAttribute('width'));
    can_h = parseInt(canvas.getAttribute('height'));
}


function goMovie(){
    initCanvas();
    initBalls(balls_number); //original is 30 --> starting number of balls
    isAnim = true;
    isBallActive = false;
    myAnim = window.requestAnimationFrame(render);

}


/*=================================================
LOGIC FUNCTIONS
=================================================== */

const resizer = () => {

  // canvas.setAttribute('width', parseInt(window.innerWidth));
  // canvas.setAttribute('height', parseInt(window.innerHeight));

  initCanvas();

}


init = e => {
  document.removeEventListener('DOMContentLoaded', init, false);

  /*=================================================
  INIT THE GLOBAL RESIZE EVENT
  =================================================== */



  window.addEventListener('resize', globalResizeThrottler, false); //listen for a resize event on the global scope
  globalResEvent = new CustomEvent('resize', { 'detail' : 'resize' }); //Create the resize event
  window.dispatchEvent(globalResEvent); //Trigger the resize event



  addInteractions();

  goMovie();



}

/* ENTRY POINT
=================================================== */

document.addEventListener('DOMContentLoaded', init, false);
