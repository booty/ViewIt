// Returns advice
function getAdvice() {
	advices = [
		"Apple's stock price always goes down after a keynote.",	"One in the hand is worth two in the bush",
		"Happy the man who finds wisdom, the man who gains understanding!", "Manners maketh the man.",
		"Measure twice, cut once.", "The squeaky wheel gets the grease.",	"To err is human; to forgive, divine."
	];
	return advices[Math.floor(Math.random()*advices.length)];
}

// Puts the specified message into the specified div, applies a style, and specifies animation.  if bounceSize=0 then don't animate
function showMessage(destinationId, messageText, cssClass, bounceSize) {
	$dest = $(document.getElementById(destinationId));
	$dest.removeClass().addClass(cssClass).text(messageText).clearQueue().animate({top: 0}, 50);
	if (bounceSize>0) bounceIt($dest,bounceSize);
}

// Bounces the specified element up and down.  bigger bounceSizePixels means more bouncy
function bounceIt($element,bounceSizePixels) {
	$element.clearQueue();
	for (i=bounceSizePixels; i>1; i=i*0.6) 
		$element.animate({top: Math.floor(i)}, 100).animate({top: Math.floor(0-i)}, 100);
	$element.animate({top: 0}, 50);
}