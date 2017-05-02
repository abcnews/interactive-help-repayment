const doc = document;
const card = require('./card.hbs');
const data = require('./data.json');
const resultTemplate = require('./result.hbs');
const container = doc.createElement('div');
const Handlebars = require("hbsfy/runtime");

Handlebars.registerHelper("currency", function(s) {
	return Math.abs(s).toFixed(0).replace(/./g, function(c, i, a) {
		return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
	});
});

require('./find-polyfill');

container.innerHTML = card(data);
doc.getElementById('help-init').appendChild(container);

// Sort the data a little
data = data.map((d, i) => {
	d.rate = d.rate/100;
	return d;
}).reverse();

Array.prototype.slice.call(doc.querySelectorAll('[type="radio"][id^="help-"]')).forEach(el => el.addEventListener('change', recalculate));
Array.prototype.slice.call(doc.querySelectorAll('[type="text"][id^="help-"]')).forEach(el => el.addEventListener('keyup', recalculate));
doc.querySelector('#help-container button').addEventListener('click', recalculate);

function recalculate() {
	let income;

	try {
		income = parseFloat(doc.getElementById('help-taxable-income').value.replace("$",'').replace(",",''));
	} catch (e) {}

	if (!!income) {
		let results = lookup(income);
		doc.getElementById('help-result').innerHTML = resultTemplate(results);
		doc.getElementById('help-notes').className = 'show';

	} else {
		if (this.className.indexOf('btn') > -1) {
			doc.getElementById('help-result').innerHTML = `<p class="error">Please enter your taxable income.</p>`;
			return;
		}
	}
}

function lookup(income) {

	// Find the rate
	let current = data.find(d => !!d.current && income >= d.current);
	let proposed = data.find(d => !!d.proposed && income >= d.proposed);

	current = current || {rate: 0};
	proposed = proposed || {rate: 0};

	return {
		income: income,
		rateCurrent: current.rate * 100,
		rateProposed: proposed.rate * 100,
		repaymentCurrent: current.rate * income,
		repaymentProposed: proposed.rate * income,
		differenceRepayment: proposed.rate * income - current.rate * income,
		differenceRate: (proposed.rate - current.rate) * 100,
		repaymentRequired: (proposed.rate * income > 0),
		noDiff: (proposed.rate * income - current.rate * income === 0),
		sign: (proposed.rate * income - current.rate * income >= 0) ? 'more' : 'less'
	}
}
