function endLoader() {
	setTimeout(function(){
		$('body').addClass('loaded');
		document.getElementById("entry-header").remove();
	}, 0);
}
