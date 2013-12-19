const VIEW_IT_OPTION_ZOOM_INCREMENT = "zoomIncrement";
const VIEW_IT_OPTION_AUTO_LOAD_FIRST_IMAGE = "autoDisplayFirstImage";
const VIEW_IT_OPTION_PRELOAD_IMAGES = "preloadImages";
const VIEW_IT_OPTION_AUTO_FIT_MODE = "autoFitMode";
const VIEW_IT_CALLBACK_FUNCTION = "callbackFunction";

// fit mode values
const VIEW_IT_FIT_MODE_HORIZONTAL = "horiztonal";
const VIEW_IT_FIT_MODE_VERTICAL = "vertical";
const VIEW_IT_FIT_MODE_NONE = "none";


viewItOptions = new Array(); // set default options
viewItOptions[VIEW_IT_OPTION_AUTO_LOAD_FIRST_IMAGE] = true; // should be true unless your connection is slow
viewItOptions[VIEW_IT_OPTION_PRELOAD_IMAGES] = true; // attempts to preload all iamges in the list.  should probably be true unless your connection is slow
viewItOptions[VIEW_IT_OPTION_ZOOM_INCREMENT] = 0.1; // 0.1 = 10% ...increment by which images are zoomed in or out
viewItOptions[VIEW_IT_OPTION_AUTO_FIT_MODE] = VIEW_IT_FIT_MODE_HORIZONTAL; // when loading a new image, use this fit mode
viewItOptions[VIEW_IT_CALLBACK_FUNCTION]  = undefined;

// usage: log('inside coolFunc',this,arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

/* ---------------------------------------------------------
	ViewIt functionality
--------------------------------------------------------- */
	
function viewItImages($canvas) {
	return $($canvas.data('listId') + ' a');
}

function $viewItImageObjects($canvas) {
	imgs = viewItImages($canvas)
	for (var i=0; i < imgs.length; i++) imgs[i]=$(imgs[i]);
	return imgs;
}

function $viewItCurrentImage($canvas) {
	return $(viewItImages($canvas)[$canvas.data('viewItIndex')]);
}

function viewItInit(canvasId, listId, navId, showPageCounter) {
	var $viPagePicker=$('<p class="viewItPopUp" id="viewItPagePicker"></p>');
	var $viCanvas=$(document.getElementById(canvasId));	
	var $viCont=$("#viewItContainer");
	var $viHelp=$('<p class="viewItPopUp" id="viewItHelpPopup"><strong>Hotkeys</strong><br>PgUp: Scroll up 10% <br>PgDn: Scroll down 10%<br>Home: Rotate right<br>End: Rotate left<br>Ins: Zoom in<br>Del: Zoom out<br>P: Show Image Picker<br>H: Show Help</p>');	
	var $viNav;
	navId = '#' + navId;
	listId = '#' + listId;
	
	// wrap container div. make inner image draggable
	$viCanvas.wrap('<div id="viewItContainer" style="height:' + $viCanvas.height() + 'px; max-height:' + $viCanvas.height() + 'px" />').parent();
	viewItDragInit($viCanvas);	
	
	// Did they supply a list of nav buttons?  If not, create that div
	if (navId) 
		$viNav = $(navId);
	else {
		$viCont.before('<div id="viewItNav"></div>');
		$viNav=$('#viewItNav');
	}
	
	var funcRotateRight = function() { viewItRotate($viCanvas,90); };
	var funcRotateLeft = function() {viewItRotate($viCanvas,-90); };
	var funcZoomIn = function() {	viewItZoomIn($viCanvas); };
	var funcZoomOut = function() { viewItZoomOut($viCanvas); };
	var funcFitHoriz = function() { viewItFitHoriz($viCanvas); };
	var funcFitVert = function() { viewItFitVert($viCanvas); };
	var funcShowPagePicker = function() {viewItShowSubButton('#viewItPagePicker');	};
	var funcShowHelp = function() {viewItShowSubButton('#viewItHelpPopup');	};
	var funcShowDebug = function() {viewItShowDebug()};
	//var funcHidePopupButtons = function() { viewItHideSubButton('.viewItPopUp'); };
	var $buttonHelp = $('<a id="viewItHelp" href="#">?</a>').click(funcShowHelp);
	var $buttonRotateRight = $('<a id="viewItRotateRight"><span class="viewItRotateRight">Right</span></a>').click(funcRotateRight);
	var $buttonRotateLeft = $('<a id="viewItRotateLeft"><span class="viewItRotateLeft">Left</span></a>').click(funcRotateLeft);
	var $buttonZoomIn = $('<a id="viewItZoomIn"><span class="viewItZoomIn">Zoom In</span></a>').click(funcZoomIn);
	var $buttonZoomOut= $('<a id="viewItZoomOut"><span class="viewItZoomOut">Zoom Out</span></a>').click(funcZoomOut);
	var $buttonFitHoriz = $('<a id="viewItFitHoriz"><span class="viewItFitHoriz">Fit Horiz</span></a>').click(funcFitHoriz);
	var $buttonFitVert = $('<a id="viewItFitVert"><span class="viewItFitVert">Fit Vert</span></a>').click(funcFitVert);
	$(document).bind("keydown", "pageup", function() { viewItScrollVert($viCanvas,0.1); });
	$(document).bind("keydown", "pagedown", function() { viewItScrollVert($viCanvas,-0.1); });
	$(document).bind("keydown", "home", funcRotateRight);
	$(document).bind("keydown", "end", funcRotateLeft);
	$(document).bind("keydown", "insert", funcZoomIn);
	$(document).bind("keydown", "del", funcZoomOut);
	$(document).bind("keydown", "p", funcShowPagePicker);
	$(document).bind("keydown", "P", funcShowPagePicker);
	$(document).bind("keydown", "h", funcShowHelp);
	$(document).bind("keydown", "H", funcShowHelp);
	$(document).bind("keydown", "d", funcShowDebug);
	$(document).bind("keydown", "esc", function() { viewItHideSubButton('.viewItPopUp') });
	
	$viNav.prepend($viHelp).prepend($buttonHelp).prepend($buttonRotateRight).prepend($buttonRotateLeft).prepend($buttonZoomIn).prepend($buttonZoomOut).prepend($buttonFitHoriz).prepend($buttonFitVert);
	$viNav.addClass('viewItNav');
	
	// get the list of images
	$viImgs = $(listId + ' a');
	switch($viImgs.length) {
		case 0:
			return;
			break;
		case 1:
			// insert a hidden div for preloading the image
			$viNav.before('<div id="viewItHidden" class="viewItHidden"></div>');
			$viHidden=$("#viewItHidden");
			$viImg= $($viImgs[0]);

			// insert the image to the hidden div so it preloads			
			var $hiddenImg = $(new Image()).attr('id','viewIt0').attr('src',$viImg.attr('href'));
			$viImg.data('viewItHiddenId','#' + $hiddenImg.attr('id')).data('viewItIndex',0);
			$viHidden.prepend($hiddenImg);	

			// store what we need to store in the canvas element as data
         $viCanvas.data('listId',listId).data('navId',$viNav.attr('id'));   

			break;
		default:
			// insert a hidden div for preloading the images
			$viNav.before('<div id="viewItHidden" class="viewItHidden"></div>');
			$viHidden=$("#viewItHidden");

			// create the forward / next buttons
			var $buttonNext = $('<a id="viewItNext" href="#"><span class="viewItNext">Next</span></a>').click(function() { viewItSkip($viCanvas,1); })
			var $buttonPrev = $('<a id="viewItPrev" href="#"><span class="viewItPrev">Prev</span></a>').click(function() { viewItSkip($viCanvas,-1); })
						
			// create the page counter
			if (showPageCounter) {
				$viPageCounter = $('<a id="viewItPageCounter" href="#"><span class="viewItButton"></span></a>');
				$viPageCounter.click(funcShowPagePicker);
				$viCanvas.data('pageCounterId','#viewItPageCounter').data('pagePickerId','#viewItPagePicker');			
			}
			
			for (var i=0; i < $viImgs.length; i++) {
				$viImg= $($viImgs[i]);

				// insert the image to the hidden div so it preloads			
				var $hiddenImg = $(new Image()).attr('id','viewIt' + i).attr('src',$viImg.attr('href'));
				$viImg.data('viewItHiddenId','#' + $hiddenImg.attr('id')).data('viewItIndex',i);
				$viHidden.prepend($hiddenImg);	

				// add to the image picker
				if (showPageCounter) {
					$pickerLink=$('<a>' + $viImg.attr('title') + '</a>').data('viewItIndex',i);
					$viPagePicker.append($pickerLink);
				}
			}
			
			// add next, prev, page counter, and page picker
			$viNav.prepend($buttonNext).prepend($buttonPrev).prepend($viPagePicker).prepend($viPageCounter);

			// assign a handler to all of the links
			$('#viewItPagePicker a, ' + listId + ' a').click(function(e) {
				e.preventDefault();
				viewItInitImageIndex($viCanvas, $(this).data('viewItIndex'));
			});
			
			// clicking anything in the nav bar should hide the popup
			//$.click(function(e) {
			$(document).click(function(e) {
				if (e.target.id!='viewItPageCounter') viewItHideSubButton('#viewItPagePicker'); 
				if (e.target.id!='viewItHelp') viewItHideSubButton('#viewItHelpPopup');
			});

			// store what we need to store in the canvas element as data
			$viCanvas.data('listId',listId).data('navId',$viNav.attr('id'));		
	
	}

	function viewItShowDebug(msg) {	}
	
	function viewItShowSubButton(subId) {
		$sub=$(subId)
		$prev=$sub.prev();
		po = $prev.offset();
		
		// need to show it before positioning, otherwise positioning is unreliable (jquery quirk)
		$sub.show('fast'); 
		$sub.offset({
			top:po.top+$prev.height()+8, 
			left:po.left//+($prev.width()/3)
		});
	}
	
	function viewItHideSubButton(id) {
		$(id).hide();
	}
	
	// load the first image
	if (viewItOptions[VIEW_IT_OPTION_AUTO_LOAD_FIRST_IMAGE]) viewItInitImageIndex($viCanvas, 0);
}

// Make the image draggable
function viewItDragInit($img) {
	$img.draggable({
		cursor: ["move"]
	});
}


function viewItInitImageIndex($canvas, imageListIndex) {
	var $hidden;
	var src;
	var $viImg;
	
	if (viewItImages($canvas).length==0)  {
		$hidden = $('#viewIt0');
		src = $('#viewIt0').attr('src');
		$viImg = $viewItImages[0];
	}
	else {
		var $viewItImages = $viewItImageObjects($canvas);
		$viImg = $viewItImages[imageListIndex];
		$hidden = $($viImg.data('viewItHiddenId'));
		src = $viImg.attr('href');
		window.log('viewItInitImageIndex: loading image in ' + $viImg.data('viewItHiddenId'));
	}
	var canvas = $canvas[0];
	var context = canvas.getContext('2d');
	if (context) {
		$hidden.attr('src','');
		$hidden.attr('src',src);
		$hidden.load(function() { 
			/*	Changing the width of the canvas also has the benefit of clearing it	*/
			canvas.width =this.width
			canvas.height = this.height;
			context.drawImage(this,0,0);
			$canvas.data('src', $viImg.attr('href')).data('viewItIndex',imageListIndex).data('viewItRotationAngle',0.0).data('fitMode',viewItOptions[VIEW_IT_OPTION_AUTO_FIT_MODE]);
			viewItFit($canvas);
			viewItConstrainScroll($canvas);
			viewItUpdatePageCount($canvas);
		});
	}
}

function viewItUpdatePageCount($canvas) {
	var label;
	var $viewItImages = $viewItImageObjects($canvas);
	
	if ($canvas.data('viewItIndex')!=undefined) 
		label = 'Image ' + (parseInt($canvas.data('viewItIndex'))+1) + '/' + $viewItImages.length;
	else
		label = 'Images: ' + $viewItImages.length;
		
	$($canvas.data('pageCounterId')).text(label);
}

function viewItAspectRatio($canvas) {
	var $img = $viewItCurrentImage($canvas);
	var hidden = $($img.data('viewItHiddenId'))[0];
	switch ($canvas.data('viewItRotationAngle')) {
		case 90:
		case 270:
			return hidden.width / hidden.height;		
		default:
			return hidden.height / hidden.width;
	}
}

function viewItSkip($canvas,inc) {
	var $imgs = viewItImages($canvas);
	var newIndex =	newIndex=parseInt($canvas.data('viewItIndex')) + inc;
	if (newIndex==-1)
		newIndex=$imgs.length-1;
	else if (newIndex==$imgs.length)
		newIndex=0;
	viewItInitImageIndex($canvas, newIndex);
}

function viewItZoomIn($canvas) {
	aspect = viewItAspectRatio($canvas);
	$canvas.width($canvas.width()*(1.0+viewItOptions[VIEW_IT_OPTION_ZOOM_INCREMENT]));
	$canvas.height($canvas.width() * aspect);
	viewItAlignWithParent($canvas);
	viewItConstrainScroll($canvas);
}

function viewItZoomOut($canvas) {
	$canvas.width($canvas.width()*(1.0-viewItOptions[VIEW_IT_OPTION_ZOOM_INCREMENT]));
	$canvas.height($canvas.width() * aspect);
	viewItAlignWithParent($canvas);
	viewItConstrainScroll($canvas);
} 

function viewItFit($canvas) {
	switch ($canvas.data('fitMode')) {
		case VIEW_IT_FIT_MODE_HORIZONTAL:
			viewItFitHoriz($canvas);
			break;
		case VIEW_IT_FIT_MODE_VERTICAL:
			viewItFitVert($canvas);
			break;
	}
}

function viewItFitHoriz($canvas) {
	aspect = viewItAspectRatio($canvas);	
	$canvas.width($canvas.parent().width());
	$canvas.height($canvas.width() * aspect);
	$canvas.data('fitMode',VIEW_IT_FIT_MODE_HORIZONTAL);
	viewItAlignWithParent($canvas);
	viewItConstrainScroll($canvas);
}

function viewItFitVert($canvas) {
	aspect = viewItAspectRatio($canvas);
	$canvas.height($canvas.parent().height());
	$canvas.width($canvas.height() / aspect);
	$canvas.data('fitMode',VIEW_IT_FIT_MODE_VERTICAL);
	viewItAlignWithParent($canvas);
	viewItConstrainScroll($canvas);
}

function viewItRotate($canvas,angleDegrees) {
	var canvas = $canvas[0];
	var $img = $viewItCurrentImage($canvas);
	var hidden = $($img.data('viewItHiddenId'))[0];
	var context = canvas.getContext('2d');
	var newAngle = $canvas.data('viewItRotationAngle') + angleDegrees;
	
	// don't let them rotate past 0 or 360
	if (newAngle < 0) newAngle=270; else if (newAngle == 360) newAngle = 0;
	
	$canvas.data('viewItRotationAngle',newAngle);
	
	if (context) {
		$canvas.width('auto').height('auto');
		switch(newAngle) {
			case 0:
				canvas.width = hidden.width;
				canvas.height = hidden.height;
				context.rotate(newAngle * Math.PI / 180);
				context.drawImage(hidden,0,0);
				break;
			case 90: 
				canvas.width = hidden.height;
				canvas.height = hidden.width;
				context.rotate(newAngle * Math.PI / 180);
				context.drawImage(hidden,0,0-canvas.width);
				break;
			case 180:
				canvas.width = hidden.width;
				canvas.height = hidden.height;
				context.rotate(newAngle * Math.PI / 180);
				context.drawImage(hidden,0-canvas.width, 0-canvas.height);
				break;
			case 270:
				canvas.width = hidden.height;
				canvas.height = hidden.width;
				context.rotate(newAngle * Math.PI / 180);
				context.drawImage(hidden,0-canvas.height,0); 
				break;
		}
		viewItFit($canvas);
		
		// Call the callback, if one was defined
		if(viewItOptions[VIEW_IT_CALLBACK_FUNCTION]!=undefined)	viewItOptions[VIEW_IT_CALLBACK_FUNCTION]($canvas.data('src'),newAngle);
	}
}

function viewItAlignWithParent($canvas) {
	parent = $canvas.parent()
	offset = parent.offset();
	$canvas.offset({left:offset.left, top:offset.top});
}

function viewItConstrainScroll($canvas) {
	$container = $canvas.parent();
	cWidth = $canvas.width();
	cHeight = $canvas.height();
	pWidth = $container.width();
	pHeight = $container.height();
	
	if ((cWidth <= pWidth) && (cHeight <= pHeight)) 
		// if the canvas is smaller than the container div in both directions, no need to scroll
		$canvas.draggable({disabled:true});
	else {
		// if necessary, constrain scrolling in one direction
		if ((cWidth <= pWidth) && (cHeight > pHeight)) $canvas.draggable('option','axis','y'); 
			else if ((cHeight <= pHeight) && (cWidth > pWidth)) $canvas.draggable('option','axis','x');
				else if ((cWidth > pWidth) && (cHeight > pHeight)) $canvas.draggable('option','axis',false);			
	
		// don't let them scroll past the edges of the image
		var containerOffset = $container.offset();
		y1 = containerOffset.top-(cHeight-pHeight);
		y2 = containerOffset.top;
		x1 = containerOffset.left-(cWidth-pWidth);
		x2 = containerOffset.left;
		$canvas.draggable({disabled:false}).draggable('option','containment',[x1,y1,x2,y2]);	
	}	
	
}

function viewItScrollVert($canvas,percent) {
	var containerOffsetTop = $canvas.parent().offset().top;
	var canvasOffset = $canvas.offset();
	var $container = $canvas.parent();
	
	// don't let them scroll past the edges
	var yMin = containerOffsetTop-($canvas.height()-$container.height());
	var yMax = containerOffsetTop;
	var newOffsetTop = canvasOffset.top + ($canvas.height() * percent);
	
	if (newOffsetTop<yMin) newOffsetTop = yMin;
	else if (newOffsetTop>yMax) newOffsetTop = yMax;
		
	$canvas.offset({top:newOffsetTop, left:canvasOffset.left});
}

function viewItWindowResize($canvas) {}