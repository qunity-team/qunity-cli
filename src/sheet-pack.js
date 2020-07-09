/**
 * Created by rockyl on 2019-12-08.
 */

import MaxRectsBinPack from "./MaxRectsBinPack";
import {sha256} from "crypto";
import generateUUID from "uuid/v4";

const packExts = ['.png']; //, '.jpg', '.jpeg', '.bmp'

export async function packImages(assets, options = {}) {
	const padding = options.padding || 1;
	const maxSize = options.maxSize || 2048;
	const mode = options.mode || 0;

	const images = await preProcessing(assets);

	let rects = [], singles = [];
	for (let item of images) {
		const {image, assets, image: {width, height}} = item;
		if (width < maxSize && height < maxSize) {
			const rectWidth = width + padding * 2;
			const rectHeight = height + padding * 2;
			rects.push({
				image,
				assets,
				width: rectWidth,
				height: rectHeight,
				area: rectWidth * rectHeight,
				sourceW: width,
				sourceH: height,
				offX: 0,
				offY: 0,
			})
		} else {
			assets.push({
				name: assets[0].name,
				ext: assets[0].ext,
				url: assets[0].url,
				uuids: assets.map(asset => asset.uuid),
			})
		}
	}

	rects.sort((a, b) => {
		return b.area - a.area;
	});

	let remainRects = rects.concat();
	let index = 0;
	while (remainRects.length > 0) {
		let name = 'sheet' + index;

		let pack = new MaxRectsBinPack(maxSize, maxSize, false);
		let packedRects = pack.insertRects(remainRects, mode);

		//document.body.append(canvas);
		canvas.width = canvas.height = maxSize;
		let context = canvas.getContext('2d');
		//context.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;
		//context.strokeRect(0, 0, maxSize, maxSize);
		for (let rect of packedRects) {
			context.drawImage(rect.image, rect.x + padding, rect.y + padding);
		}
		let blob = await new Promise(resolve => {
			canvas.toBlob(function (blob) {
				resolve(blob);
			}, 'image/png');
		});

		let frames = {};
		let i = 0;
		for (let rect of packedRects) {
			let sprite = {
				x: rect.x + padding,
				y: rect.y + padding,
				w: rect.width - padding * 2,
				h: rect.height - padding * 2,
				ox: rect.offX,
				oy: rect.offY,
				sw: rect.sourceW,
				sh: rect.sourceH,
			};

			for (let asset of rect.assets) {
				frames[asset.uuid] = Object.assign({}, sprite, {name: asset.name});
				i++;
			}
		}

		assets.push({
			ext: '.sht',
			file: new File([blob], name + '.png'),
			frames,
		});

		index++;
	}
}

function loadImage(url, assets) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = function () {
			resolve({
				image: img,
				assets,
			})
		};
		img.onerror = reject;
		img.src = url;
	})
}

export async function preProcessing(assets) {
	let targetAssets = [];
	for (let i = 0, li = assets.length; i < li; i++) {
		const asset = assets[i];
		if (packExts.includes(asset.ext)) {
			targetAssets.push(assets.splice(i, 1)[0]);
			i--;
			li--;
		}
	}

	let groups = {};
	for (let asset of targetAssets) {
		let group = groups[asset.url];
		if (!group) {
			group = groups[asset.url] = [];
		}
		group.push(asset);
	}

	let ps = [];

	for (let url in groups) {
		ps.push(loadImage(url, groups[url]))
	}

	return await Promise.all(ps);
}
