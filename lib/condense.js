let _ = require('lodash');

function hasCapitalLetter(word, skipFirstLetter) {
	var start = 0;
	var letter = null;
	if(skipFirstLetter) {
		start++;
	}
	for(var i=start; i<word.length; i++) {
		letter = word.charAt(i);
		if(letter.toUpperCase() == letter && letter >= 'A' && letter <= 'Z') {
			return true;
		}
	}
	return false;
}

function normalizeWord(word) {
	if(word.substr(-2) === '\'s') {
		return word.substr(0, word.length-2);
	}
	return word;
}

module.exports = function(scrubbed) {
	let start = 0;
	let sentences = [];

	for(let i=0; i<scrubbed.length; i++) {
		let char = scrubbed.charAt(i);
		if(char === '\n') {
			sentences.push(scrubbed.substring(start, i));
			start = i;
		}
		else if((char === '.' || char === '!' || char === '?') && i > 2) {
			let current = i+1;
			while(current < scrubbed.length && /[\s\n]/.test(scrubbed.charAt(current))) current++;
			if(current === scrubbed.length || (current - i > 1 && !/[a-z]/.test(scrubbed.charAt(current)))) {
				sentences.push(scrubbed.substring(start, i));
				start = current;
			}
		}
	}
	sentences.push(scrubbed.substring(start));

	let subSentences = [];
	sentences.forEach((sentence) => {
		let pieces = sentence.split(/[\,\:\"\*\(\)\|\`\’\‘]/);
		pieces.forEach((piece) => {
			let trimmed = piece.trim();
			if(trimmed) {
				subSentences.push(piece.trim());
			}
		});
	});

	// console.log(sentences);
	// console.log(scrubbed);
	// scrubbed = scrubbed.replace(/[^a-zA-Z0-9\-\_ \.\n] /ig, '. ');
	// console.log(scrubbed);
	// console.log(scrubbed.split('\n'));
	// let sentences = [];
	// scrubbed.split('\n').forEach((line) => {
	// 	let linePieces = line.split(/\.\s+[A-Z]/);
	// 	linePieces.forEach((linePiece) => {
	// 		sentences.push(linePiece.split(/[^a-zA-Z0-9'_\-\.]/).filter((word) => {
	// 			return word.trim();
	// 		}));
	// 	});
	// });
	// console.log(sentences);
	// return;

	// let sentences = scrubbed.split('\n').reduce((prev, current) => {
	// 	current = current.trim();
	// 	if(current.length) {

	// 		prev = prev.concat(current.split(/\.\s/).map((sentence) => {
	// 			return sentence.trim().split(/[^a-zA-Z0-9]+$/);
	// 			// return sentence.trim().replace(/[^a-zA-Z0-9]+$/, '').replace(/^[^a-zA-Z0-9]+/, '');
	// 		}));
	// 	}
	// 	return prev;
	// }, []);
	// console.log(sentences);
	// sentences = [sentences[0]];
	// console.log(sentences);
	// let sentences = scrubbed.split('.').map((sentence) => {
	// 	return sentence.trim();
	// });
	let phraseMap = {};

	for(let i=0; i<subSentences.length; i++) {
		let words = subSentences[i].split(/\s/);
		let streak = [];
		for(let j=0; j < words.length; j++) {
			let skipFirst = (j === 0) && ((words.length === 1) || !hasCapitalLetter(words[1]));
			if(hasCapitalLetter(words[j], skipFirst) && words[j] != 'I' && words[j] != 'A' && words[j].toUpperCase() != 'CEO') {
				streak.push(words[j]);
			}
			else if(streak.length) {
				if(words[j] === 'of' || words[j] === 'the') {
					streak.push(words[j]);
				}
				else if(streak[streak.length-1] === 'of' && words[j] === 'the') {
					streak.push(words[j]);
				}
				else {
					var tmp = normalizeWord(streak.join(' '));
					if(!phraseMap.hasOwnProperty(tmp)) {
						phraseMap[tmp] = 0;
					}
					phraseMap[tmp]++;
					streak = [];
				}
			}
		}
		if(streak.length) {
			var tmp = normalizeWord(streak.join(' '));
			if(!phraseMap.hasOwnProperty(tmp)) {
				phraseMap[tmp] = 0;
			}
			phraseMap[tmp]++;
		}
	}

	let phrases = [];
	for(let word in phraseMap) {
		phrases.push({
			text: word,
			count: phraseMap[word]
		});
	}

	return _.sortBy(phrases, function(info) {
		return -1*info.count;
	});
};