// ***SITE CREDIT***
console.log(
	'%cSite by View Source \n%cview-source.com',
	[
		'margin: 20px 0 0;',
		'font-size: 12px',
		'font-family: Helvetica, sans-serif',
		'font-weight: 700',
	].join(';'),
	[
		'margin: -5px 0 20px;',
		'font-size: 12px',
		'font-family: Helvetica, sans-serif',
		'font-weight: 400',
	].join(';')
);

// ***GLOBAL VARIABLES***

const root = document.documentElement;
const tabletBreakpoint = 1024;
const mobileBreakpoint = 600;
const isTouchDevice = window.matchMedia('(any-hover: none)').matches;

isTabletScreen = tabletBreakpoint >= innerWidth;
isMobileScreen = mobileBreakpoint >= innerWidth;

window.addEventListener('resize', () => {
	isTabletScreen = tabletBreakpoint >= innerWidth;
	isMobileScreen = mobileBreakpoint >= innerWidth;
});

// ***BFCACHE*** https://web.dev/bfcache

// prevent safari to load from cache
window.addEventListener('pageshow', (event) => {
	if (event.persisted) location.reload(true);
});

// prevent chrome to load from cache
const perfEntries = performance.getEntriesByType('navigation');
if (typeof perfEntries[0] != 'undefined') {
	if (perfEntries[0].type === 'back_forward') location.reload(true);
}

// ***UTILITIES / GET***

const getRandomInt = (min, max) => {
	const _min = Math.ceil(min);
	const _max = Math.floor(max);

	// inclusive of max and min
	return Math.floor(Math.random() * (_max - _min + 1) + _min);
};

const getOffset = (el) => {
	const elBounding = el.getBoundingClientRect();

	return {
		top: elBounding.top + scrollY,
		left: elBounding.left + scrollX,
	};
};

const getSiblings = (el) => {
	return Array.from(el.parentNode.children).filter(function (sibling) {
		return sibling !== el;
	});
}; 

const getUrlBaseAndPath = (url) => {
	if (url.includes('?')) {
		return url.split('?')[0];
	} else {
		return url;
	}
};


// ***UTILITIES / VALIDATION***

const validateAndReturnJson = (json) => {
	try {
		JSON.parse(json);
	} catch (e) {
		console.error(e);
		return false;
	}

	return JSON.parse(string);
};

const validateJson = (string) => {
	try {
		JSON.parse(string);
	} catch (e) {
		console.error(e);
		return false;
	}

	return JSON.parse(string);
};


// ***ACTIONS***

const scrollDisable = () => {
	document.documentElement.style.overflow = 'hidden';

	if (isTouchDevice) {
		document.body.style.overflow = 'hidden';
	}
};

const scrollEnable = () => {
	document.documentElement.style.overflow = 'initial';

	if (isTouchDevice) {
		document.body.style.overflow = 'initial';
	}
};

// event delegation
// example; on('body', 'click', '.accordion-toggle, .accordion-toggle *', e => {…});
const on = (selector, eventType, childSelectors, eventHandler) => {
	const _childSelectors = childSelectors.split(',');
	const elements = document.querySelectorAll(selector);

	for (element of elements) {
		element.addEventListener(eventType, (eventOnElement) => {
			_childSelectors.forEach((selector) => {
				if (
					eventOnElement.target.matches(selector) ||
					eventOnElement.target.closest(selector)
				) {
					eventHandler(eventOnElement);
				}
			});
		});
	}
};

const parseHtmlString = (htmlString) => {
	const parser = new DOMParser();
	return parser.parseFromString(htmlString, 'text/html');
};

// TODO:
// throttle
