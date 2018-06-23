var BMCityStyle = require('./bm-city-style.js');
var stringUtils = require('../../utils/string-utils.js');
var mathUtils = require('../../utils/math-utils.js');
var basics = require('../../utils/basics.js');
var constants = require('../../utils/constants.js');
var KonvaImages = require('../../utils/konva-images.js');

class BMCityView extends Konva.Group {
  static GroupSize() { return 32; }

  constructor(stage, city, layer, style) {
    var cityNormalizedCoords = mathUtils.lonlat2coord(city.data.lon, city.data.lat);

    super({
      x: cityNormalizedCoords.x * stage.width(),
      y: cityNormalizedCoords.y * stage.height(),
      width: BMCityView.GroupSize(),
      height: BMCityView.GroupSize(),
      draggable: false,
      listening: true
    });

    this.stage = stage;
    this.city = city;

    this.layer = layer;
    this.style = new BMCityStyle(style);
    
    this.layer.add(this);

    this.createKonvaNodes();
    this.attachEvents();

    this.blinkingIntervalId = null;

    this.style.update(this.circleCity, this.circlePlayer);
  }

  destroyJSObject() {
    clearTimeout(this.blinkingIntervalId);
    this.style.destroyJSObject();
    basics.destroyObject(this);
  }

  createKonvaNodes() {
    this.circleCity = new Konva.Circle({
      width: this.width(),
      height: this.height(),
      listening: true,
      draggable: false,
    });
    this.add(this.circleCity);

    this.circlePlayer = new Konva.Circle({
      width: this.width() * 0.5,
      height: this.height() * 0.5,
      draggable: false,
      listening: false,
      visible: !stringUtils.isNullOrEmpty(this.city.data.owner)
    });
    this.add(this.circlePlayer);

    var treasure = 0;
    try {
      treasure = parseFloat(this.city.data.treasure);
    } catch(e) {
      console.error("[BMCityView] City treasure is not a float");
    }
    
    if (treasure) {
      var treasureIcon = new Konva.Image({
        x: BMCityView.GroupSize() / 2,
        y: BMCityView.GroupSize() / 2,
        width: BMCityView.GroupSize(),
        height: BMCityView.GroupSize(),
        offsetX: BMCityView.GroupSize() / 2,
        offsetY: BMCityView.GroupSize() / 2,
        listening: false,
        opacity: 0.75
      });
      this.add(treasureIcon);
      var konvaImages = new KonvaImages();
      konvaImages.add('assets/imgs/actionCollect.png', treasureIcon);
      konvaImages.load(function(){}, 
        (function() {
          this.draw();
        }).bind(this)
      );
    }
  }

  attachEvents() {
    this.on('mouseenter', 
      (function(evt) {
        evt.evt.preventDefault();
        this.city.onMouseEnter(evt);
      }).bind(this)
    );
    
    this.on('mouseout', 
      (function(evt) {
        evt.evt.preventDefault();
        this.city.onMouseOut(evt);
      }).bind(this)
    );
    
    this.on('click',
      (function(evt) {
        evt.evt.preventDefault();
        this.city.onClick(evt);
      }).bind(this)
    );
  }

  removeEvents() {
    this.off('mouseenter');
    this.off('mouseout');
    this.off('click');
  }

  clearView() {
    this.setStyle(BMCityStyle.styleClear());
    this.draw();
  }

  setOwnedCity() {
    this.setStyle(BMCityStyle.styleOwned());
  }

  setCurrentCity() {
    var labelCurrentCity = new Konva.Label({
      x: 0,
      y: - BMCityView.GroupSize() / 2,
      opacity: 0.85,
      visible: true,
      listening: false
    });
    this.add(labelCurrentCity);
    labelCurrentCity.add(
      new Konva.Tag({
        fill: 'black',
        pointerDirection: 'down',
        pointerWidth: 10,
        pointerHeight: 10,
        lineJoin: 'round',
        shadowColor: 'black',
        cornerRadius: 10,
        shadowBlur: 10,
        shadowOffset: 10,
        shadowOpacity: 0.5,
        listening: false
      })
    );
    labelCurrentCity.add(
      new Konva.Text({
        text: 'You are here',
        fontFamily: 'Calibri',
        fontSize: 18,
        padding: 5,
        fill: 'white',
        listening: false
      })
    );

    this.setStyle(BMCityStyle.styleCurrent());
  }

  setNearCity() {
    var setOriginStyle;
    var setNearStyle; 
    var blinkTime = 500;
    
    var originalStyle = Object.assign({},this.style);

    setOriginStyle = (function() {
      this.clearView();
      this.setStyle(originalStyle);
      this.draw();
      this.blinkingIntervalId = setTimeout(
        (function() {
          setNearStyle();
        }).bind(this), blinkTime
      );
    }).bind(this);

    setNearStyle = (function() {
      this.clearView();
      this.setStyle(BMCityStyle.styleNear());
      this.draw();
      this.blinkingIntervalId = setTimeout(
        (function() {
          setOriginStyle();
        }).bind(this), blinkTime
      );
    }).bind(this);

    setNearStyle();
  }

  setStyle(style) {
    this.style.setStyle(style);
    this.style.update(this.circleCity, this.circlePlayer);
  }
}

module.exports = BMCityView;