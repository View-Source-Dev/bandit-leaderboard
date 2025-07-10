const main = document.querySelector('.data');
const rowsPerBlock = 10;
const interval = 8 * 1000;

const createRow = (data, index) => {
	const row =
	data[index] ?
		`
			<tr class="table-row">
				<td><div>${data[index].num || ''}</div></td>
				<td><div>${data[index].initial || ''}</div></td>
				<td><div>${data[index].last_name  || ''}</div></td>
				<td><div>${data[index].borough  || ''}</div></td>
				<td><div>${data[index].pr  || ''}</div></td>
				<td><div>${data[index].goal  || ''}</div></td>
			</tr>
		`
		: ''
	;
	return row;
}

const renderItems = data => {

	let currentRow = 0;
	const totalRows = data.length;
	const totalBlocks = Math.ceil(totalRows / rowsPerBlock);
	

	const renderBlock = (currentBlock) => {
		if (currentBlock >= totalBlocks) {
			currentBlock = 0;
			currentRow = 0;
		}

		let block = '';
		for (let i = 0; i < rowsPerBlock; i++) {
			block += createRow(data, currentRow);
			currentRow++;
		}

		main.innerHTML = block;

		setTimeout(() => {
			renderBlock(currentBlock + 1);
		}, interval);

	};

	renderBlock(0);

};


fetch('assets/data-2025-2.json')
	.then(response => response.json())
	.then(data => {
		// And passes the data to the function, above!
		renderItems(data)
	})
