'use strict';
const API_KEY = 'eac62e41c47d62737e4d600acd47433f';
const emulate = debounce(emulateKeyDowns, 300);
let pending = false;

const jsonFlickrFeed = (data) => {
	let images = "";
	data.forEach(function (img) {
		images += `<img class="image" src=https://farm${img.farm}.staticflickr.com/${img.server}/${img.id}_${img.secret}.jpg>`;
	});
	document.getElementById('output').innerHTML = images;
};

const initKeysNavigation = () => {
	const div = document.getElementById('output');
	const KEY_UP = 38;
	const KEY_DOWN = 40;
	const KEY_LEFT = 37;
	const KEY_RIGHT = 39;
	let selectedRow = 0;

	document.body.onkeydown = function(e) {
		e.preventDefault();
		const images = div.querySelectorAll('img');
		const imageWithSelectedClass = [...images].findIndex(n => n.classList.contains('selected'));
		if (pending) return;
		if (selectedRow !== imageWithSelectedClass) {
			selectedRow = imageWithSelectedClass;
		}   
		images[selectedRow].classList.remove('selected');
		if (
			images.length - selectedRow <= 10
			&& !getData.isLastPage()
			&& (e.keyCode === KEY_DOWN || e.keyCode === KEY_RIGHT)
			)
		{
			pending = true;
			getData.pageIncrease();
			getData.doFetch();
		}
		if (
			selectedRow <= 10
			&& !getData.isFirstPage()
			&& (e.keyCode === KEY_UP || e.keyCode === KEY_LEFT)
			)
		{
			pending = true;
			getData.pageDecrease();
			getData.doFetch(true);
		}
		switch (e.keyCode) {
		case KEY_UP:
			selectedRow = selectedRow - 5;
			break;
		case KEY_DOWN:
			selectedRow = selectedRow + 5
			break;
		case KEY_LEFT:
			selectedRow--;
			break;
		case KEY_RIGHT:
			selectedRow++;
			break;
		}

		if(selectedRow >= images.length){
			selectedRow = images.length - 1;
		} else if(selectedRow < 0){
			selectedRow = 0;
		}
		images[selectedRow].classList.add('selected');
		window.scrollTo({
			top: images[selectedRow].offsetTop,
			behavior: 'smooth'
		});
	};
	div.querySelectorAll('img')[0].classList.add('selected');
};

const updateCurrentImages = (data, isDecrease) => {
	const outputDiv = document.getElementById('output');
	const imagesArray = [...outputDiv.querySelectorAll('img')];
	data.forEach(function (img) {
		const image = new Image();
		image.className = 'image';
		image.src = `https://farm${img.farm}.staticflickr.com/${img.server}/${img.id}_${img.secret}.jpg>`;
		if (isDecrease) {
			outputDiv.insertBefore(image, outputDiv.firstChild);
		} else {
			outputDiv.appendChild(image);
		}
	});
	[...isDecrease ? imagesArray.slice(-40) : imagesArray.slice(0, 40)].forEach(n => outputDiv.removeChild(n));
};

const getData = new function() {
	let firstRun = true;
	let page = 1;
	let perPage = 50;
	let pages = null;

	this.doFetch = (isDecrease) => {
		fetch(`https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=${API_KEY}&per_page=${perPage}&page=${page}&format=json&nojsoncallback=1`)
		.then(response => response.json())
		.then((res) => {
			try {
				if (firstRun) {
					jsonFlickrFeed(res.photos.photo);
					initKeysNavigation();
					firstRun = false;
					perPage = 40;
				} else {
					pending = false;
					updateCurrentImages(res.photos.photo, isDecrease);
					pages = res.photos.pages;
				}
			}
			catch(err) {
				console.log(err);
			}
		});
	}

	this.isFirstPage = _ => page === 1;
	this.isLastPage = _ => !!pages && page >= pages;
	this.pageIncrease = _ => pages && page >= pages ? pages : ++page;
	this.pageDecrease = _ => page === 1 ? page : --page;
};

document.addEventListener('wheel', e => {
	e.preventDefault();
	emulate(e);
});

function debounce(f, ms) {
	let timer = null;
	return function (...args) {
		const onComplete = () => {
			f.apply(this, args);
			timer = null;
		}
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(onComplete, ms);
	};
}

function emulateKeyDowns(e) {
	const event = new Event('keydown');
	if (e.deltaY < 0) {
		event.keyCode = 38;
	} else {
		event.keyCode = 40;
	}
	document.body.dispatchEvent(event);
}

getData.doFetch();