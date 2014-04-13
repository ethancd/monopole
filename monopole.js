$(function(){
  MoPo = function(){
    Array.prototype.include = function(obj) {
      return (this.indexOf(obj) !== -1);
    }

    var colors = {
      black: -1,
      white: 1
    };

    var turn = colors.black;

    var depth = 0;

    var main = function(){
      setUpBoard();
      attachEventListeners();
    };

    var setUpBoard = function(){
      var spaces = [];
      var space;
      for (var i = 0; i < 6; i++ ){
        for (var j = 0; j < 6; j++ ){
          space = $('<div class="space empty"></div>');
          space.addClass((i + j) % 2 ? 'odd' : '');
          space.attr('id', 'id' + j + '-' + i)

          if ([1,4].include(i) && [1,4].include(j)){
            space.addClass('score low-value');
            space.text('1');
          }

          if ([2,3].include(i) && [2,3].include(j)){
            space.addClass('score low-value');
            space.text('1');
          }

          spaces.push(space);
        }
      }
      $('#board').append(spaces);
    };

    var attachEventListeners = function(){
      $('.space').on('click', layStone);
      $('#random').on('click', randomMove);
      $('#toggleColor').on('click', toggleColor);
      $('body').on('keydown', shiftToToggleColor);
    };

    var shiftToToggleColor = function(event){
      if (event.keyCode === 16){
        toggleColor();
      }
    };

    var randomMove = function() {
      $spaces = $('.empty');
      space = $spaces[Math.floor(Math.random() * $spaces.length)];
      $(space).trigger('click');
    };

    var toggleColor = function(targetColor) {
      if (typeof targetColor === "string") {
        turn = (targetColor === 'white' ? colors.white : colors.black);
      } else {
        turn = (turn === colors.black ? colors.white : colors.black);
      }
      $('#toggleColor').text("Current color is " + (turn === colors.black ? 'black': 'white'));
    };

    var togglePlayer = function() {
      if ($('h2').text() === "First player to move") {
        $('h2').text("Second player to move");
        toggleColor('white');
      } else {
        $('h2').text("First player to move");
        toggleColor('black');
      }
    }

    var layStone = function(event){
      var targetSpace = event.currentTarget;
      depth = 0;
      if (!$(targetSpace).hasClass('empty')){
        return;
      }
      $(targetSpace).removeClass('empty');
      $(targetSpace).attr('data-ttl', 4);
      $(targetSpace).addClass(turn === colors.black ? 'black' : 'white');
      togglePlayer();
      updateStones($(targetSpace));
    };

    var ageStones = function() {
      $('[data-ttl]').each(function(i, el){
        $(el).attr('data-ttl', $(el).attr('data-ttl') - 1);
        if ($(el).attr('data-ttl') === "0") {
          $(el).removeAttr('data-ttl');
          $(el).addClass('rooted');
        }
      });
    }

    var updateStones = function($excludedStone){
      var lastStep = false;
      depth += 1;

      $stones = $('.space').not('.empty').not('.rooted');
      if ($excludedStone) {
        $stones = $stones.not('#' + $excludedStone.attr('id'));
      }
      
      var stonesToMove = [];
      lastStep = true;

      $stones.each(function(i, el) {
        if (planStone(el)){
          stonesToMove.push($(el));
          lastStep = false;
        }
      });

      for(var i = 0; i < stonesToMove.length; i++) {
        moveStone(stonesToMove[i]);
      }

      if (!lastStep && depth < 9) {
        setTimeout(function(){
          updateStones($excludedStone);
        }, 500);
      } else if ($excludedStone) {
        setTimeout(function(){
          updateStones();
        }, 500);
      } else {
        ageStones();
        updateScore();
      }
    };

    var updateScore = function () {
      var blackScore = getScore('black');
      var whiteScore = getScore('white');

      $('h3.black').text('Black (1st): ' + blackScore);
      $('h3.white').text('White (2nd): ' + whiteScore);
    };

    var getScore = function(colorName) {
      var sum = 0;
      $('.score.' + colorName).each(function(i, el){
        sum += parseInt($(el).text());
      });

      return sum;
    };

    var planStone = function(space) {
      var surroundingSpaces = getSurroundingSpaces($(space));
      var color = $(space).hasClass('black') ? colors.black : colors.white;

      var destination = {
        id: $(space).attr('id'),
        energy: getEnergy(color, $(space), $(space)) - 0.1
      };

      var newEnergy;
      var space;
      for(var i = 0; i < surroundingSpaces.length; i++) {
        newSpace = surroundingSpaces[i];
        newEnergy = getEnergy(color, newSpace,  $(space));
        if (newEnergy < destination.energy) {
          destination = {
            id: $(newSpace).attr('id'),
            energy: newEnergy
          }
        }
      }

      $(space).attr('data-destination', destination.id);
      return destination.id !== $(space).attr('id');
    };

    var moveStone = function(space) {
      var destination = $('#' + $(space).attr('data-destination'));
      if (!destination.hasClass('empty') || destination.hasClass('rooted')) {
        return;
      }

      destination.removeClass('empty white black');
      destination.addClass($(space).hasClass('black') ? 'black' : 'white');
      destination.attr('data-ttl', $(space).attr('data-ttl'));
      $(space).removeClass('white black').addClass('empty');
      $(space).removeAttr('data-ttl');
    };

    var getEnergy = function(color, space, excludedStone) {
      var $stones = $('.space').not('.empty').not('.rooted').not('#' + excludedStone.attr('id'));
      var energy = 0;
      var polarity = color === colors.black ? -1 : 1;
      var d;
      var relativePolarity;

      $stones.each(function(i, el) {
        d = getDistance($(el).attr('id'), $(space).attr('id'));
        relativePolarity = polarity * ($(el).hasClass('black') ? -1 : 1);
        energy += (relativePolarity / (d * d));
      })

      return energy;
    };

    var getSurroundingSpaces = function(space) {
      var surroundingSpaces = [];
      var currentPoint = getPointFromId(space.attr('id'));
      var $spot;
      for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
          $spot = $('#id' + (currentPoint.x + j) + '-' + (currentPoint.y + i));
          if ($spot.length && $spot.hasClass('empty') && !$spot.hasClass('rooted') &&
              (i === 0) !== (j === 0)) {
            surroundingSpaces.push($spot[0]);
          }
        }
      }

      return surroundingSpaces;
    };

    var getDistance = function(a, b) {
      var a = getPointFromId(a);
      var b = getPointFromId(b);

      return Math.pow(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2), 0.5);
    };

    var getPointFromId = function(id) {
      var arr = id.match(/\d+/g);

      return {
        x: parseInt(arr[0]),
        y: parseInt(arr[1])
      };
    };

    return {
      main: main
    };
  }();

  MoPo.main();
});