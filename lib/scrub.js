let cheerio = require('cheerio');

module.exports = function(raw) {
	let $ = cheerio.load(raw);
	$('script').remove();
	$('style').remove();

	function findArticle(node, articleCandidates) {
		if(!node || !node.children || !node.children.length) {
			return;
		}

		let numParagraphs = 0;
		let candidateLength = 0;
		let child = null;
		let paragraphs = [];
		// let debug = $(node).hasClass('body');
		let debug = false;
		for(let i=0; i<node.children.length; i++) {
			child = node.children[i];
			if(isParagraph(child, debug)) {
				paragraphs.push($(child).text().trim().replace(/\s+/g, ' '));
			}
		}

		if(paragraphs.length > 1 && paragraphs.length/node.children.length >= 0.5 || paragraphs.length > 6 || paragraphs.join() > 280) {
			articleCandidates.push(node);
		}
		else {
			for(let i=0; i<node.children.length; i++) {
				findArticle(node.children[i], articleCandidates);
			}
		}
		if(debug) {
			console.log('candidateLength', candidateLength);
			console.log(numParagraphs, '/', node.children.length, '=', numParagraphs/node.children.length);
			console.log(numParagraphs > 1 && numParagraphs/node.children.length >= 0.5 || numParagraphs > 6);
			console.log(articleCandidates.length);
		}
	}

	function isParagraph(node, debug) {
		if(node.type === 'tag') {
			while(node.type === 'tag' && node.children && node.children.length === 1) {
				node = node.children[0];
			}
			if(node.type !== 'tag') {
				node = node.parent;
			}
			let $node = $(node);
			let text = $node.text().replace(/\s+/g, ' ').length;
			let html = $node.html().trim().length;

			if(text > 100 && text/html > 0.75) {
				return true;
			}
		}
		return false;
	}

	let articleCandidates = [];
	findArticle($('body')[0], articleCandidates);
	if(!articleCandidates.length) {
		return null;
	}
	return articleCandidates.map((c) => {
		return text(c).join(' ');
	}).join('\n\n').trim();
};

function text(node) {
	if(node.children && node.children.length) {
		let textElements = [];
		for(let i=0; i<node.children.length; i++) {
			textElements = textElements.concat(text(node.children[i]).filter((text) => {
				return text;
			}));
		}
		return textElements;
	}

	if(node.type === 'text') {
		return [node.data];
	}
	return [false];
}