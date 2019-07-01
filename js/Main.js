/*=================================================
GLOBAL VARS
=================================================== */

const controls = document.getElementById('controls'),
      canvas = document.getElementById('canvas'),
      ctx = canvas.getContext('2d');

let   can_w = parseInt(canvas.getAttribute('width')),
      can_h = parseInt(canvas.getAttribute('height')),
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
    balls_number = 10, //Var to hold a reference for the amount of inital balls
    myActiveBall, //Create a var to hold a reference for the most nearest ball when mouse down
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

function getRandomSpeed(pos){
    let min = -1, //-1
        max = 1; //1

    // let min,max;
    //
    // if(hasDir) {
    //   min = -5;
    //   max = 5;
    // }else {
    //   min = -1;
    //   max = 1;
    // }

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

// Update balls
function updateBalls(){
  let new_balls = [];

  if(isAnim) {
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
               ctx.strokeStyle = 'rgba(150,150,150,'+alpha+')';
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
  let fraction, alpha;
  for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {

         fraction = getDisOf(balls[i], balls[j]) / dis_limit;

         if(fraction < 1){
             alpha = (1 - fraction).toString();

             ctx.strokeStyle = 'rgba(150,150,150,1)';
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
      R = 3;

      renderBalls();

      renderLines();

      updateBalls();

      addBallIfy();

    }else {

      //window.cancelAnimationFrame(myAnim);

      R = 5;

      //getRandomBall();
      defineLines();
      renderBalls();

      updateBalls();


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

  //Controls


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
        balls_number--;
        removeBallIfy();
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
    console.log('mousedown');

    if (typeof console != 'undefined') {
        console.log(e.clientX, e.clientY, balls);
    }



    balls.forEach((el,i) => {

      if (typeof console != 'undefined') {
          console.log('ball ' + i + ' has ' + Math.round(el.x) + ' x position and mouse x position is ' + Math.round(e.clientX) );
          console.log('ball ' + i + ' has ' + Math.round(el.y) + ' y position and mouse y position is ' + Math.round(e.clientY) );
      }

      // if( Math.round(el.x) == Math.round(e.clientX) )  {
      //
      //     if( Math.round(el.y) == Math.round(e.clientY) ){
      //       myActiveBall = i;
      //     }
      //
      //
      // }




    });






  });

  canvas.addEventListener('mouseup', (e) => {
    console.log('mouseup');
    myActiveBall = [];
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
    // console.log(mouse_ball);
  });

  window.addEventListener('resize', globalResizeThrottler, false); //listen for a resize event on the global scope
  globalResEvent = new CustomEvent('resize', { 'detail' : 'resize' }); //Create the resize event
  window.dispatchEvent(globalResEvent); //Trigger the resize event

  goMovie();



}

/* ENTRY POINT
=================================================== */

document.addEventListener('DOMContentLoaded', init, false);
