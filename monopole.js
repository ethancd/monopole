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
      for (var i = 0; i < 9; i++ ){
        for (var j = 0; j < 9; j++ ){
          space = $('<div class="space empty"></div>');
          space.addClass((i + j) % 2 ? 'odd' : '');
          space.attr('id', 'id' + j + '-' + i)

          if ([1,7].include(i) && [1,7].include(j)){
            space.addClass('high-value');
            space.text('3');
          }

          if ([3,5].include(i) && [3,5].include(j) ||
              i === 4 && j === 4){
            space.addClass('low-value');
            space.text('2');
          }

          spaces.push(space);
        }
      }
      $('#board').append(spaces);
    };

    var attachEventListeners = function(){
      $('.space').on('click', layStone);
      $('button').on('click', randomMove);
    };

    var randomMove = function () {
      $spaces = $('.empty');
      space = $spaces[Math.floor(Math.random() * $spaces.length)];
      $(space).trigger('click');
    };

    var layStone = function(event){
      var targetSpace = event.currentTarget;
      depth = 0;
      if (!$(targetSpace).hasClass('empty')){
        return;
      }
      $(targetSpace).removeClass('empty');
      $(targetSpace).addClass(turn === colors.black ? 'black' : 'white');
      turn = turn === colors.black ? colors.white : colors.black;
      updateStones($(targetSpace));
    };

    var updateStones = function($excludedStone){
      var lastStep = false;
      depth += 1;

      $stones = $('.space').not('.empty');
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
      }
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
      if (!destination.hasClass('empty')) {
        return;
      }

      destination.removeClass('empty white black');
      destination.addClass($(space).hasClass('black') ? 'black' : 'white');
      $(space).removeClass('white black').addClass('empty');
    };

    var getEnergy = function(color, space, excludedStone) {
      var $stones = $('.space').not('.empty').not('#' + excludedStone.attr('id'));
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
    }

    var getSurroundingSpaces = function(space) {
      var surroundingSpaces = [];
      var currentPoint = getPointFromId(space.attr('id'));
      var $spot;
      for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
          $spot = $('#id' + (currentPoint.x + j) + '-' + (currentPoint.y + i));
          if ($spot.length && (i || j) && $spot.hasClass('empty')) {
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