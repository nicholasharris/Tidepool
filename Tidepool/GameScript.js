//////////////// FUNCTIONS AND DEFINITIONS ////////////////////////////

// Fixed Constants ////
point_mutation = 0.05;
insert_mutation = 0.0;
delete_mutation = 0.0;
copy_mutation = 0.0;
big_delete_mutation = 0.0;
big_copy_mutation = 0.0;

min_genome_length = 1000;
max_genome_length = 5000;

CANVAS_WIDTH = 1400;
CANVAS_HEIGHT = 800;

MAX_SPEED = 10;
COEF_OF_FRICTION = 0.01;

MAX_GEN = 0;

//TICK_S = 0.002;
TICK_MS = 0.5;

// defined axis names
const AXIS = {x : 0, y : 1}

///// Some functions ////////////////////////

// function computes the reflected angle
// rad Incoming angle in radians
// dir direction of reflection. Any of AXIS, defaults to AXIS.location_y
function reflectAngle(rad, dir) {
  return dir === AXIS.location_x ? Math.acos(-Math.cos(rad)) : Math.asin(-Math.sin(rad));
}

// Calculate the reflection angle in degrees against 
// a vertical barrier
// parameter a = incident angle
// returns reflected angle
function reflectNS(a) 
{
  var r = Math.PI*2 - a;
  while (r < 0) r += 2*Math.PI;
  return r;
}

// Calculate the reflection angle in degrees against 
// a horizontal barrier
// parameter a = incident angle
// returns reflected angle
function reflectEW(a) 
{
  var r = Math.PI - a;
  while (r < 0) r += Math.PI*2;
  return r;
}

//functions to convert rgb color to hex
var rgbToHex = function (rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

var fullColorHex = function(r,g,b) {   
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return red+green+blue;
};

/* hexToComplimentary : Converts hex value to HSL, shifts
 * hue by 180 degrees and then converts hex, giving complimentary color
 * as a hex value
 * @param  [String] hex : hex value  
 * @return [String] : complimentary color as hex value
 */
function hexToComplimentary(hex){

  // Convert hex to rgb
  // Credit to Denis http://stackoverflow.com/a/36253499/4939630
  var rgb = 'rgb(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length/3 + '})', 'g')).map(function(l) { return parseInt(hex.length%2 ? l+l : l, 16); }).join(',') + ')';

  // Get array of RGB values
  rgb = rgb.replace(/[^\d,]/g, '').split(',');

  var r = rgb[0], g = rgb[1], b = rgb[2];

  // Convert RGB to HSL
  // Adapted from answer by 0x000f http://stackoverflow.com/a/34946092/4939630
  r /= 255.0;
  g /= 255.0;
  b /= 255.0;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2.0;

  if(max == min) {
      h = s = 0;  //achromatic
  } else {
      var d = max - min;
      s = (l > 0.5 ? d / (2.0 - max - min) : d / (max + min));

      if(max == r && g >= b) {
          h = 1.0472 * (g - b) / d ;
      } else if(max == r && g < b) {
          h = 1.0472 * (g - b) / d + 6.2832;
      } else if(max == g) {
          h = 1.0472 * (b - r) / d + 2.0944;
      } else if(max == b) {
          h = 1.0472 * (r - g) / d + 4.1888;
      }
  }

  h = h / 6.2832 * 360.0 + 0;

  // Shift hue to opposite side of wheel and convert to [0-1] value
  h+= 180;
  if (h > 360) { h -= 360; }
  h /= 360;

  // Convert h s and l values into r g and b values
  // Adapted from answer by Mohsen http://stackoverflow.com/a/9493060/4939630
  if(s === 0){
      r = g = b = l; // achromatic
  } else {
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  r = Math.round(r * 255);
  g = Math.round(g * 255); 
  b = Math.round(b * 255);

  // Convert r b and g values to hex
  rgb = b | (g << 8) | (r << 16); 
  return "#" + (0x1000000 | rgb).toString(16).substring(1);
}  

function distanceSquaredToLineSegment(lx1, ly1, lx2, ly2, px, py) {
  var ldx = lx2 - lx1,
      ldy = ly2 - ly1,
      lineLengthSquared = ldx*ldx + ldy*ldy;
  return distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py);
}

function distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py) {
  var t; // t===0 at line pt 1 and t ===1 at line pt 2
  if (!lineLengthSquared) {
     // 0-length line segment. Any t will return same result
     t = 0;
  }
  else {
     t = ((px - lx1) * ldx + (py - ly1) * ldy) / lineLengthSquared;

     if (t < 0)
        t = 0;
     else if (t > 1)
        t = 1;
  }
  
  var lx = lx1 + t * ldx,
      ly = ly1 + t * ldy,
      dx = px - lx,
      dy = py - ly;
  return dx*dx + dy*dy;   
}

function raycast(start_x, start_y, angle)  //function to return the first object hit moving along a ray, and the distance to that object
{
   // return 1;

    //check for animals along ray
    var shortest_dist = 999999;
    var shortest_start = shortest_dist;

    //end point of arbitrariliy long line segment (ray)
    var end_x = start_x + Math.cos(angle)*4000;
    var end_y = start_y + Math.sin(angle)*4000;
    for(var i = 0; i < myPopulation.length; i++)
    {
        var r = Math.sqrt(distanceSquaredToLineSegment(start_x, start_y, end_x, end_y, myPopulation[i].location_x, myPopulation[i].location_y));
        if(  r < myPopulation[i].size )
        {
            //thx Euclid & co.
            var theta = Math.abs(angle - Math.atan( (myPopulation[i].location_y - start_y) / (myPopulation[i].location_x - start_x)  ));
            var D = r/Math.tan(theta);
            var d = Math.sqrt( (myPopulation[i].location_y*myPopulation[i].location_y) - (r*r) );

            var dist = D - d;

            if (dist < shortest_dist)
            {
              shortest_dist = dist;
            }
        }
    }

    //return the closest detected distance
    if(shortest_dist < shortest_start)
    {
      if (shortest_dist < 1)
      {
        shortest_dist = 1;
      }
      return shortest_dist;   //distance to animal
    }
    else
    {
      return -1;
      if(angle <= Math.PI)
      {
        if(cos(angle)*(CANVAS_WIDTH - start_x) < sin(angle)*(CANVAS_WIDTH - start_y)) //closest wall is bottom
        {

        }
      }
      return -1*Math.sqrt((start_x - end_x)*(start_x - end_x) - (start_y - end_y)*(start_y - end_y));   //distance to wall (negative to convey wall, not animal)
    }
    
}

function check_point_to_walls_collision(point_x, point_y)
{
  if(point_x < 0 || point_x > CANVAS_WIDTH)
  {
    return true;
  }
  else if (point_y < 0 || point_y > CANVAS_HEIGHT)
  {
    return true;
  }
  return false;
}

function check_point_to_animals_collision(point_x, point_y)
{
   for(var i = 0; i < myPopulation.length; i++)
   {
     var dist_to_animal = Math.sqrt( Math.pow(point_x - myPopulation[i].location_x, 2) + Math.pow(point_y - myPopulation[i].location_y, 2))
     if (dist_to_animal < (myPopulation[i].size + 0.01))
     {
       return true;
     }
   }
   return false;
}

//function to detect collisions between animals
function check_animal_collisions(pop)
{
  var animals_to_kill = []; //animals that are eaten will all be removed at once, at the end of this function

  /// bounce animals off other animals ///////////
  for (var i = 0; i < pop.length; i++)
  {
    pop[i].collided = [];
  }
  for (var i = 0; i < pop.length; i++)
  {
     
     for(var j = 0; j < pop.length; j++)
     {
       
       var firstBall = pop[i];
       var secondBall = pop[j];

        ////console.log(firstBall.location_x)
        ////console.log(secondBall.location_x)
       if (firstBall.location_x + firstBall.size + secondBall.size > secondBall.location_x 
        && firstBall.location_x < secondBall.location_x + firstBall.size + secondBall.size
        && firstBall.location_y + firstBall.size + secondBall.size > secondBall.location_y 
        && i != j)
        //&& Math.abs(firstBall.location_x - secondBall.location_x) > 0.001 && Math.abs(firstBall.location_y - seconBall.location_y) > 0.001 )
        {
            //AABBs are overlapping
            
            var first_newX = firstBall.location_x + firstBall.speed*Math.cos(firstBall.velocity_dir) * 3*TICK_MS;
            var first_newY = firstBall.location_y + firstBall.speed*Math.sin(firstBall.velocity_dir) * 3*TICK_MS;

            var second_newX = secondBall.location_x + secondBall.speed*Math.cos(secondBall.velocity_dir) * 3*TICK_MS;
            var second_newY = secondBall.location_y + secondBall.speed*Math.sin(secondBall.velocity_dir) * 3*TICK_MS;

            var distance = Math.sqrt(
              ((first_newX - second_newX) * (first_newX - second_newX))
            + ((first_newY - second_newY) * (first_newY - second_newY))
             );

             var distance2 = Math.sqrt(
              ((firstBall.location_x - secondBall.location_x) * (firstBall.location_x - secondBall.location_x))
            + ((firstBall.location_y - secondBall.location_y) * (firstBall.location_y - secondBall.location_y))
             );
            
            /*
            var distance = Math.sqrt(
              ((firstBall.location_x - secondBall.location_x) * (firstBall.location_x - secondBall.location_x))
            + ((firstBall.location_y - secondBall.location_y) * (firstBall.location_y - secondBall.location_y))
             );*/
        
            if ((distance < firstBall.size + secondBall.size + 1) && pop[j].collided.indexOf(i) < 0 && pop[i].collided.indexOf(j) < 0)
            {
                //balls have collided
                pop[i].collided.push(j);
                pop[j].collided.push(i);
                var collisionPointX = 
                ((firstBall.location_x * secondBall.size) + (secondBall.location_x * firstBall.size)) 
                / (firstBall.size + secondBall.size);
                
                var collisionPointY = 
                ((firstBall.location_y * secondBall.size) + (secondBall.location_y * firstBall.size)) 
                / (firstBall.size + secondBall.size);

                //Check if either animal got ate (detect mouth collision)
                var mpoint1x = firstBall.location_x + (Math.cos(firstBall.mouth_location + firstBall.rotation)*(0.9 *firstBall.size));
                var mpoint1y = firstBall.location_y + (Math.sin(firstBall.mouth_location + firstBall.rotation)*(0.9 *firstBall.size));

                var mpoint2x = secondBall.location_x + (Math.cos(secondBall.mouth_location + secondBall.rotation)*(0.9 *secondBall.size));
                var mpoint2y = secondBall.location_y + (Math.sin(secondBall.mouth_location + secondBall.rotation)*(0.9 *secondBall.size));

                var dist_to_mouth1 = Math.sqrt( (mpoint1x - secondBall.location_x)*(mpoint1x - secondBall.location_x) + (mpoint1y - secondBall.location_y)*(mpoint1y - secondBall.location_y ) )
                var dist_to_mouth2 = Math.sqrt( (mpoint2x - firstBall.location_x)*(mpoint2x - firstBall.location_x) + (mpoint2y - firstBall.location_y)*(mpoint2y - firstBall.location_y) )

                if (dist_to_mouth1 < (secondBall.size + firstBall.size/4.0))
                {
                  if (dist_to_mouth2 < (firstBall.size + secondBall.size/4.0))
                  {
                     if (firstBall.size > secondBall.size)
                     {
                       animals_to_kill.push(j); //remove the animal who got nommed
                       
                       myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));

                       //mark reproduce on animal who done the nomming
                       firstBall.reproducing_count += secondBall.reproducing_count + 1;
                     }
                     else
                     {
                       animals_to_kill.push(i);
                       myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));
                       secondBall.reproducing_count +=  firstBall.reproducing_count + 1;
                     }
                  }
                  else //if (firstBall.size >= secondBall.size)
                  {
                    animals_to_kill.push(j);
                    myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));
                    firstBall.reproducing_count += secondBall.reproducing_count + 1;
                  }
                }
                else if (dist_to_mouth2 < (firstBall.size + secondBall.size/4.0))
                {
                  if (dist_to_mouth1 < (secondBall.size + firstBall.size/4.0))
                  {
                     if (firstBall.size > secondBall.size)
                     {
                      animals_to_kill.push(j); //remove the animal who got nommed
                       myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));

                       // reproduce on animal who done the nomming
                       firstBall.reproducing_count += secondBall.reproducing_count + 1;
                     }
                     else
                     {
                       animals_to_kill.push(i);
                       myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));
                       secondBall.reproducing_count +=  firstBall.reproducing_count + 1;
                     }
                  }
                  else // if (secondBall.size >= firstBall.size)
                  {
                    animals_to_kill.push(i);
                    myDeathAnimations.push( new deathAnimation(collisionPointX, collisionPointY, myDeathAnimations.length));
                    secondBall.reproducing_count +=  firstBall.reproducing_count + 1;
                  }
                }
                else
                {
                    /*
                var newVelX1 = (firstBall.speed * Math.cos(firstBall.velocity_dir) * (firstBall.weight - secondBall.weight) + (2 * secondBall.weight * secondBall.speed* Math.cos(secondBall.velocity_dir))) / (firstBall.weight + secondBall.weight);
                var newVelY1 = (firstBall.speed * Math.sin(firstBall.velocity_dir) * (firstBall.weight - secondBall.weight) + (2 * secondBall.weight * secondBall.speed* Math.sin(secondBall.velocity_dir))) / (firstBall.weight + secondBall.weight);
                var newVelX2 = (secondBall.speed* Math.cos(secondBall.velocity_dir) * (secondBall.weight - firstBall.weight) + (2 * firstBall.weight * firstBall.speed * Math.cos(firstBall.velocity_dir))) / (firstBall.weight + secondBall.weight);
                var newVelY2 = (secondBall.speed* Math.sin(secondBall.velocity_dir) * (secondBall.weight - firstBall.weight) + (2 * firstBall.weight * firstBall.speed * Math.sin(firstBall.velocity_dir))) / (firstBall.weight + secondBall.weight);
                */

                var dx = (firstBall.location_x - firstBall.size) - (secondBall.location_x - secondBall.size);
                var dy = (firstBall.location_y + firstBall.size) - (secondBall.location_y + secondBall.size);

                collision_angle = Math.atan2(dy, dx);

                var new_xspeed_1 = firstBall.speed*Math.cos(firstBall.velocity_dir-collision_angle);
                var new_yspeed_1 = firstBall.speed*Math.sin(firstBall.velocity_dir-collision_angle);
                var new_xspeed_2 = secondBall.speed*Math.cos(secondBall.velocity_dir-collision_angle);
                var new_yspeed_2 = secondBall.speed*Math.sin(secondBall.velocity_dir-collision_angle);

                var final_xspeed_1 = ((firstBall.weight-secondBall.weight)*new_xspeed_1+(secondBall.weight+secondBall.weight)*new_xspeed_2)/(firstBall.weight+secondBall.weight);
                var final_xspeed_2 = ((firstBall.weight+firstBall.weight)*new_xspeed_1+(secondBall.weight-firstBall.weight)*new_xspeed_2)/(firstBall.weight+secondBall.weight);
                var final_yspeed_1 = new_yspeed_1;
                var final_yspeed_2 = new_yspeed_2;

               var newVelX1 = Math.cos(collision_angle)*final_xspeed_1+Math.cos(collision_angle+Math.PI/2)*final_yspeed_1;
               var newVelY1 = Math.sin(collision_angle)*final_xspeed_1+Math.sin(collision_angle+Math.PI/2)*final_yspeed_1;
               var newVelX2 = Math.cos(collision_angle)*final_xspeed_2+Math.cos(collision_angle+Math.PI/2)*final_yspeed_2;
               var newVelY2 = Math.sin(collision_angle)*final_xspeed_2+Math.sin(collision_angle+Math.PI/2)*final_yspeed_2;

                firstBall.velocity_dir = Math.atan2(newVelY1, newVelX1);
                secondBall.velocity_dir = Math.atan2(newVelY2, newVelX2);

                firstBall.speed = Math.sqrt(newVelX1*newVelX1 + newVelY1*newVelY1);   // thx pythagoras
                secondBall.speed = Math.sqrt(newVelX2*newVelX2 + newVelY2*newVelY2);

                /*
                firstBall.location_x = firstBall.location_x + newVelX1* TICK_MS;
                firstBall.location_y = firstBall.location_y + newVelY1* TICK_MS;
                secondBall.location_x = secondBall.location_x + newVelX2* TICK_MS;
                secondBall.location_y = secondBall.location_y + newVelY2* TICK_MS;*/
                }    

            }
        }

     }
  }

  //remove killed animals
  var newPop = [];
  for (var i = 0; i < pop.length; i++)
  {
    if (animals_to_kill.indexOf(i) < 0) //animal was not marked to be killed
    {
      newPop.push(pop[i]);
    }
  }
  pop.splice(0, pop.length);
  for (var i = 0; i < newPop.length; i++)
  {
    pop.push(newPop[i]);
  }
}


//////////////////////////////////////////// Classes/GA stuff //////////////////////////////////////////////////////////////
//little flash when the animals die :(
class deathAnimation 
{
  constructor(loc_x, loc_y, index)
  {
    this.location_x = loc_x;
    this.location_y = loc_y;
    this.index = index;

    this.time = 0;
  }

  render(context)
  {
    //draw flash
    context.beginPath();
    context.arc(this.location_x,this.location_y, this.time + 1 , 0, 2*Math.PI); //flash circle    //third parameter was 
    context.strokeStyle = 'rgba(255, 0, 0,' + (1.0-(this.time/49)).toString(10) + ')';
    context.lineWidth = 0.01;
    context.fillStyle = 'rgb(255, 0, 0, ' + (1.0-(this.time/49)).toString(10) + ')';
    context.stroke();
    context.fill();

    
    this.time += 1;
  }
}

class birthAnimation 
{
  constructor(loc_x, loc_y, index)
  {
    this.location_x = loc_x;
    this.location_y = loc_y;
    this.index = index;

    this.time = 0;
  }

  render(context)
  {
    //draw flash
    context.beginPath();
    context.arc(this.location_x,this.location_y, 1.5*this.time + 1 , 0, 2*Math.PI); //flash circle
    context.strokeStyle = 'rgba(0, 255, 0,' + (1.0-(this.time/49)).toString(10) + ')';
    context.lineWidth = 0.01;
    context.fillStyle = 'rgb(0, 255, 0, ' + (1.0-(this.time/49)).toString(10) + ')';
    context.stroke();
    context.fill();

    this.time += 1;
  }
}

///////////////// ANIMAL CLASS ///////////////////////////////////////
class animal  //Class for high-level animal entity
{
   constructor(genome, gen) 
   {
      //create genome
      this.genome = genome;
      this.gen = gen;
      if(this.gen > MAX_GEN)
      {
        MAX_GEN = this.gen;
      }

      //////extract phenotype from genome //////////
      //size & color
      this.size = this.genome.sequence[0]/11.0 + 3; 
      this.weight = Math.PI*this.size*this.size; //weight scales with area
      this.color = []
      this.color.push(this.genome.sequence[1]);
      this.color.push(this.genome.sequence[2]);
      this.color.push(this.genome.sequence[3]);

      //location/orientation
      this.location_x = Math.floor(Math.random()*CANVAS_WIDTH);
      this.location_y = Math.floor(Math.random()*CANVAS_HEIGHT);
      this.velocity_dir = Math.random()*2*Math.PI;
      this.rotation = Math.random()*2*Math.PI;
      this.speed = 0;
      this.mouth_location = (this.genome.sequence[4]/100.0) * ((2*Math.PI)/2.55);  //range (0, 2PI), anywhere on the animal's body
      this.mouth_color = hexToComplimentary( fullColorHex(this.color[0], this.color[1], this.color[2]) ); //complementary color of body

      this.num_limbs = this.genome.sequence[5] % 6;

      this.reproducing_count = 0;
      this.reproduce_time = 0;

      this.collided = [];

      //limbs
      this.limbs = []

      for (var i = 0; i < this.num_limbs * 2; i+=2)
      {
          var point = (this.genome.sequence[ (6 + i) % this.genome.sequence.length]/100.0) * ((2*Math.PI)/2.55);  //range (0, 2PI), anywhere on the animal's body
          var length = (this.genome.sequence[(6 + i +1)% this.genome.sequence.length]/6.0) + 1;  //length of limb
          if (length > (4.0*this.size))
          {
            length = 4.0*this.size;
          }

          var new_limb = new limb(point, length);
          this.limbs.push(new_limb);
        
      }

      //neurons
      this.neurons = []
      var index = 6 + 2*this.num_limbs + 1;
      this.num_neurons = this.genome.sequence[index] % 6;
      index += 1;
      var num_neurons = this.num_neurons;
      if (this.num_limbs > 0)
      {
        
        for(var i = 0; i < num_neurons*2; i++)
        {
          var weights = []
          var output_index = this.genome.sequence[(i + index) % this.genome.sequence.length] % this.num_limbs;

          //console.log("index: " + index.toString(10));

          //console.log("char: " + this.genome.sequence[(i + index) % this.genome.sequence.length].toString(10) )

          //console.log("o index: " + output_index.toString());
          i++;
          for (var j = 0; j < 37; j++)
          {
            weights.push(this.genome.sequence [(index + i + j) % this.genome.sequence.length]/256.0 - 1.0);
          }

          //console.log("o index: " + output_index.toString());
        
          var n = new neuron(weights, output_index);
          //console.log("output index: " + n.output_index.toString());
          this.neurons.push(n);
          
        }
      }
      else
      {
        this.num_neurons = 0;
      }
   }
   
   tick(context)
   {

    /// Activate brain and calculate limb motion ///
    for(var i = 0; i < this.neurons.length; i++)
    {
      //get inputs from sight
      var inputs = []
      inputs.push(this.limbs[this.neurons[i].output_index].rotation);
      for(var j = 0; j < 12; j++)
      {
        var point1 = this.location_x + (Math.cos(this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))*(this.size));
        var point2 = this.location_y + (Math.sin(this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))*(this.size));
        inputs.push(raycast(point1, point2, this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))); //add inputs from sight
      }

      this.limbs[this.neurons[i].output_index].force = (this.neurons[i].activate(inputs)) * this.limbs[this.neurons[i].output_index].force_dir;
      this.limbs[this.neurons[i].output_index].vel += (this.limbs[this.neurons[i].output_index].force) / this.limbs[this.neurons[i].output_index].length;

      this.limbs[this.neurons[i].output_index].rotation += this.limbs[this.neurons[i].output_index].vel * TICK_MS/20;

      //reverse limb motion at one extreme
      if (this.limbs[this.neurons[i].output_index].rotation > Math.PI/2 )
      {
        this.limbs[this.neurons[i].output_index].rotation = Math.PI/2;
        this.limbs[this.neurons[i].output_index].vel = 0;
        if ( this.limbs[this.neurons[i].output_index].force_dir == -1)
        {
          
          this.limbs[this.neurons[i].output_index].force_dir *= -1;
        }
      }
      //reverse limb motion at other extreme
      else if (this.limbs[this.neurons[i].output_index].rotation < -Math.PI/2)
      {
        this.limbs[this.neurons[i].output_index].rotation = -Math.PI/2;
        this.limbs[this.neurons[i].output_index].vel = 0;
        if(this.limbs[this.neurons[i].output_index].force_dir == 1)
        {
          
          this.limbs[this.neurons[i].output_index].force_dir *= -1;
        }
      }

    }

    //add thrust from limbs
    var xspeed = this.speed*Math.cos(this.velocity_dir);
    var yspeed = this.speed*Math.sin(this.velocity_dir);

    for( var i = 0; i < this.num_limbs; i++)
    {
      xspeed -= Math.cos(this.limbs[i].anchor_point + this.rotation)*Math.abs(this.limbs[i].vel)*this.limbs[i].length/(this.size * 100);
      yspeed -= Math.sin(this.limbs[i].anchor_point + this.rotation)*Math.abs(this.limbs[i].vel)*this.limbs[i].length/(this.size * 100);

      this.rotation -= this.limbs[i].vel*this.limbs[i].length/3000;
    }
    
    this.velocity_dir = Math.atan2(yspeed, xspeed);

    this.speed = Math.sqrt(xspeed*xspeed + yspeed*yspeed); //thx pythagoras


     //apply friction
     if (this.speed > 0)
     {
      this.speed -= COEF_OF_FRICTION*this.speed;
     }


    
    /// bounce off walls /////////////////
    if ( (this.location_x > CANVAS_WIDTH - this.size && this.location_x + this.speed*Math.cos(this.velocity_dir) * TICK_MS > this.location_x) 
      || ((this.location_x < 0 + this.size && this.location_x + this.speed*Math.cos(this.velocity_dir) * TICK_MS < this.location_x ) ))
    {
      this.velocity_dir = reflectEW(this.velocity_dir);
    }
    if ( (this.location_y > CANVAS_HEIGHT - this.size && this.location_y + this.speed*Math.sin(this.velocity_dir) * TICK_MS > this.location_y)
        || (this.location_y < 0 + this.size && this.location_y + this.speed*Math.sin(this.velocity_dir) * TICK_MS < this.location_y ) )
    {
      this.velocity_dir = reflectNS(this.velocity_dir);
    }

    //wrap
    /*
     if (this.location_x > CANVAS_WIDTH)
     {
       this.location_x = 0.0;
     }
     else if (this.location_x < 0)
     {
       this.location_x = CANVAS_WIDTH;
     }
     if (this.location_y > CANVAS_HEIGHT)
     {
       this.location_y = 0.0;
     }
     else if (this.location_y < 0)
     {
       this.location_y = CANVAS_HEIGHT;
     }
     */
     

     //bound speed
    if (this.speed > MAX_SPEED )
    {
      this.speed = MAX_SPEED;
    }

    if (this.speed < 0)
    {
      this.speed = 0;
    }

    //update x-location
    this.location_x += this.speed*Math.cos(this.velocity_dir) * TICK_MS;
    //update y-location
    this.location_y += this.speed*Math.sin(this.velocity_dir) * TICK_MS;

     //render animal
     this.render(context);
   }

   reproduce()  //function to create new animals from the current parent
   {
      this.reproduce_time = 0;

      var new_sequence = this.genome.mutate(this.genome.sequence);

      var new_animal = new animal(new genome(new_sequence.length, new_sequence), this.gen + 1);
      
      var dist1 = this.location_x;
      var dist2 = this.location_y;
      
      var eject_angle; //angle to eject newborn animal (want to move away from the parent to avoid endless rekilling)

      var best_dist = 0;
      var best_angle = 0;

      for(var j = 0; j < 12; j++)  //choose angle along which distance to nearest object is maximized.
      {
        var point1 = this.location_x + (Math.cos(this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))*(this.size));
        var point2 = this.location_y + (Math.sin(this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))*(this.size));
        
        var new_dist = Math.abs(raycast(point1, point2, this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2))); 
        if(new_dist > best_dist)
        {
          best_dist = new_dist;
          best_angle = this.mouth_location + this.rotation + (j/12.0)*(Math.PI*2);

          new_animal.location_x = point1 + new_animal.size*Math.cos(best_angle);// + 3*Math.cos(best_angle);
          new_animal.location_y = point2 + new_animal.size*Math.sin(best_angle);// + 3*Math.sin(best_angle);
          
          new_animal.velocity_dir = best_angle;
          new_animal.speed = 5;

        }
      }
      

      myPopulation.push(new_animal);
      myBirthAnimations.push(new birthAnimation( (this.location_x + new_animal.location_x)/2.0, (this.location_y + new_animal.location_y)/2.0, myBirthAnimations.length ));

      this.reproducing_count -= 1;
   }

   render(context)  //Function to render the animal on canvas
   {
      //draw body
      context.beginPath();
      context.arc(this.location_x, this.location_y, this.size, 0, 2*Math.PI);  //draw the body of the animal
      context.strokeStyle = 'rgb(' + this.color[0] + ', ' + this.color[1] + ', ' + this.color[2] + ')'; 
      context.lineWidth = 2;
      context.stroke();

      //draw mouth
      var mpoint1 = this.location_x + (Math.cos(this.mouth_location + this.rotation)*(0.9 *this.size));
      var mpoint2 = this.location_y + (Math.sin(this.mouth_location + this.rotation)*(0.9 *this.size));
      context.beginPath();
      context.arc(mpoint1, mpoint2, this.size/4.0, 0, 2*Math.PI); //mouth circle
      context.strokeStyle = this.mouth_color.toString(16);
      context.lineWidth = 1;
      context.fillStyle = this.mouth_color.toString(16);
      context.stroke();
      context.fill();
      

      //draw limbs
      for (var i = 0; i < this.limbs.length; i++)
      {

        context.beginPath();
        var point1 = this.location_x + (Math.cos(this.limbs[i].anchor_point + this.rotation)*this.size);
        var point2 = this.location_y + (Math.sin(this.limbs[i].anchor_point + this.rotation)*this.size);
        context.moveTo(point1, point2);
        var point3 = this.location_x + Math.cos(this.limbs[i].anchor_point + this.rotation)*(this.size) + Math.cos(this.limbs[i].rotation + this.limbs[i].anchor_point + this.rotation)*this.limbs[i].length;
        var point4 = this.location_y + Math.sin(this.limbs[i].anchor_point + this.rotation)*(this.size) + Math.sin(this.limbs[i].rotation+ this.limbs[i].anchor_point + this.rotation)*this.limbs[i].length;
        context.lineTo(point3, point4);

        context.lineWidth = 2;
        context.strokeStyle = 'rgb(' + this.color[0] + ', ' + this.color[1] + ', ' + this.color[2] + ')'; 
        context.stroke();
      }

      //draw aura if it is in the process of reproducing
      if(this.reproducing_count > 0)
      {
        //draw flash
        context.beginPath();
        context.arc(this.location_x,this.location_y, this.size + (this.size/5) , 0, 2*Math.PI); //aura circle
        context.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        context.lineWidth = 0.01;
        context.fillStyle = 'rgba(0, 255, 0, 0.3)';
        context.stroke();
        context.fill();

        
        this.reproduce_time += 1;

        if(this.reproduce_time > 150)
        {
          this.reproduce();
        }
      }


   }
}

class limb
{
  constructor(anchor_point, length){
    this.anchor_point = anchor_point;
    this.length = length;
    this.rotation = 0;
    this.vel = 0;
    this.force = 0;
    this.force_dir = 1;
  }
}

class neuron //class definition for artificial neuron
{
    constructor(weights, output_index)
    {
      this.weights = weights;
      this.output_index = output_index;
    }
    activate(inputs)
    {
       var output = 0;
       for(var i = 0; i < inputs.length; i++)
       {
         output += inputs[i]*this.weights[i];
       }

       return Math.tanh(output);
    }
}

class genome  //Class that defines chromosome
{
  constructor(length, sequence) //class constructor creates genome sequence
  {
    if(sequence === undefined) //single paramaeter call of the constructor
    {
      this.sequence = [];
      for (var i = 0; i < length; i++)
      {
        this.sequence.push(Math.floor((Math.random() * 256)));  //Random number between 0 and 255 (for each element in chromosome)
      }
    }
    else
    {
      this.sequence = [];
      for(var i = 0; i < sequence.length; i++)
      {
        this.sequence.push(sequence[i]);
      }
    }
  }


  mutate(old_sequence)  //Function to enact mutations on the chromosome during reproduction
  {
      var sequence = []
      for(var i = 0; i < old_sequence.length; i++)
      {
        sequence.push(old_sequence[i]);
      }
      // Big delete mutation
      if (sequence.length >= min_genome_length && Math.random() <= big_delete_mutation )
      {
          var delete_length = Math.floor(Math.random() * 250) + 50;
          var delete_index = Math.floor(Math.random() * sequence.length);

          sequence.splice(delete_index, delete_length);
      }

      // Big Copy Mutation  
      if (sequence.length < max_genome_length && Math.random() <= big_delete_mutation )
      {
        var copy_length = Math.floor(Math.random() * 250) + 50;
        var copy_index = Math.floor(Math.random() * sequence.length);

        for(var i = 0; i < copy_length; i++)
        {
          sequence.splice(copy_index, 0, Math.floor(Math.random()*256));
        }
      }

      //Point mutations
      for(var i = 0; i < sequence.length; i++)
      {
         if(Math.random() <= point_mutation)
         {
           sequence[i] = Math.floor((Math.random() * 256));  //new random value
         }
      }

      return sequence;
  }

}
//// Canvas and Game Stuff ///////////////

/*
class gameManager  //manager class to handle aspects of the game as it's running
{

}*/

function clean_animations()  //remove flashes when appropriate
{
  for(var i = 0; i < myDeathAnimations.length; i++)
  {
     if(myDeathAnimations[i].time > 50)
     {
       myDeathAnimations.splice(i, 1);
       i = 0;
     }
  }
  for(var i = 0; i < myBirthAnimations.length; i++)
  {
     if(myBirthAnimations[i].time > 50)
     {
       myBirthAnimations.splice(i, 1);
       i = 0;
     }
  }
}


function startGame() //function to initialize game
{
    myGameArea.start();
    myPopulation = [];
    myDeathAnimations = [];
    myBirthAnimations = [];
 
  for (var i = 0; i < 50; i++)
  {
    var a = new animal(new genome(1000), 0);
    myPopulation.push(a);
  }
}
  
var myGameArea = 
{
    canvas : document.createElement("canvas"),
    start : function() 
    {
      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;
      this.canvas.id = "canvas";
      this.canvas.style = "border:1px solid #000000";
      this.canvas.parentElement = "parent";
      this.context = this.canvas.getContext("2d");
      document.body.insertBefore(this.canvas, document.body.childNodes[4]);
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Game loop
function game_loop()
{
  var c = document.getElementById("canvas");
  var ctx = c.getContext("2d");

  //clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  //draw background color
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, 0);
  ctx.strokeStyle =  "rgba(0, 0, 0, 1)";
  ctx.fillStyle = "rgba(0, 255, 0, 0.05)";
  ctx.fill();
  ctx.stroke();
  //draw border
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.moveTo(0, 0);
  ctx.lineTo(0, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, 0);
  ctx.lineTo(0, 0);
  ctx.strokeStyle =  "rgba(0, 0, 0, 1)";
  ctx.stroke();

  //tick animal entities
  for(var i = 0; i < myPopulation.length; i++)
  {
    myPopulation[i].tick(ctx);
  }
  //check collisions
  check_animal_collisions(myPopulation);
  //render death flashes
  for(var i = 0; i < myDeathAnimations.length; i++)
  {
    myDeathAnimations[i].render(ctx);
  }
  //render birth flashes
  for(var i = 0; i < myBirthAnimations.length; i++)
  {
    myBirthAnimations[i].render(ctx);
  }
  //destroy spent animations
  clean_animations();

  //update text/stats
  update_text();
  ctx.closePath();
  //do it again
  window.requestAnimationFrame(game_loop);
}

function update_text()
{
  document.getElementById("stats").innerHTML = "Num Animals: " + myPopulation.length.toString(10) + "  Max Gen: " + MAX_GEN.toString(10);
}
 ///////////////// MAIN CONTENT /////////////////////////////////////////

startGame(); //initializes game
window.requestAnimationFrame(game_loop);  //launches game- and rendering-loop





 
 


  


