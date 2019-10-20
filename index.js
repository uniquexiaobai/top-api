const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

app.use(cors());

const fetchDataFromTophub = (url) => async () => {
	const { data } = await axios.get(url);
	const $ = cheerio.load(data);
	const list = [];

	$('.Zd-p-Sc .cc-dc:first-child table tr').each(function() {
		const $a = $(this).find('td[class=al] > a');
		list.push({
			id: $a.attr('itemid'),
			title: $a.text().trim(),
			url: $a.attr('href'),
		});
	});

	return list;
};

const weiboTophubUrl = 'https://tophub.today/n/KqndgxeLl9';
const weixinTophubUrl = 'https://tophub.today/n/WnBe01o371';
const kaiyanTophubUrl = 'https://tophub.today/n/KqndgDmeLl';
const zhihuTophubUrl = 'https://tophub.today/n/KMZd7VOvrO';
const zuimeiTophubUrl = 'https://tophub.today/n/zQ0or05d8B';
const _36kyTophubUrl = 'https://tophub.today/n/Q1Vd5Ko85R';
const sspaiTopHubUrl = 'https://tophub.today/n/Y2KeDGQdNP';

const fetchWeiboData = fetchDataFromTophub(weiboTophubUrl);
const fetchWeixinData = fetchDataFromTophub(weixinTophubUrl);
const fetchKaiyanData = fetchDataFromTophub(kaiyanTophubUrl);
const fetchZhihuData = fetchDataFromTophub(zhihuTophubUrl);
const fetchZuimeiData = fetchDataFromTophub(zuimeiTophubUrl);
const fetch36kyData = fetchDataFromTophub(_36kyTophubUrl);
const fetchSspaiData = fetchDataFromTophub(sspaiTopHubUrl);

const fetchEchojsData = async () => {
	const { data } = await axios.get('https://www.echojs.com/');
	const $ = cheerio.load(data);
	const list = [];

	$('#newslist > article').each(function() {
		const $a = $(this).find('h2 > a');
		const id = $(this).data('news-id');
		const title = $a.text();
		const url = $a.attr('href');

		list.push({
			id,
			title,
			url,
		});
	});

	return list;
};

const fetchYuqueData = async () => {
	const baseUrl = 'https://www.yuque.com';
	const { data } = await axios.get(
		`${baseUrl}/api/explore/recommends?limit=20`,
	);
	const list = data.data.docs.map((item) => {
		return {
			id: item.id,
			title: item.title,
			url: `${baseUrl}/${item.book.user.login}/${item.book.slug}/${item.slug}`,
		};
	});

	return list;
};

const fetchMaoyanData = async () => {
	const baseUrl = 'https://piaofang.maoyan.com';
	const { data } = await axios.get(`${baseUrl}/rankings/year`);
	const $ = cheerio.load(data);
	const list = [];

	$('#ranks-list > .row').each(function() {
		const id = $(this)
			.data('com')
			.match(/\/(\d+)\'/)[1];
		const title = $(this)
			.find('.first-line')
			.text();
		const url = `${baseUrl}/movie/${id}`;

		list.push({
			id,
			title,
			url,
		});
	});

	return list;
};

const fetchXinqujiData = async () => {
	const baseUrl = 'https://xinquji.com';
	const { data } = await axios.get(`${baseUrl}`);
	const $ = cheerio.load(data);
	const list = [];

	$('.ant-card')
		.eq(0)
		.find('.link')
		.each(function() {
			const id = $(this)
				.attr('href')
				.match(/posts\/(\d+)$/)[1];
			const title = $(this)
				.find('.content > h3')
				.text();
			const desc = $(this)
				.find('.content > p')
				.text();
			const url = `${baseUrl}/posts/${id}`;

			list.push({
				id,
				title,
				desc,
				url,
			});
		});

	return list;
};

fetchXinqujiData();

const targetActionMap = {
	weibo: fetchWeiboData, // 微博
	weixin: fetchWeixinData, // 微信
	kaiyan: fetchKaiyanData, // 开眼
	zhihu: fetchZhihuData, // 知乎日报
	zuimei: fetchZuimeiData, // 最美应用
	echojs: fetchEchojsData, // Echojs
	yuque: fetchYuqueData, // 语雀
	maoyan: fetchMaoyanData, // 猫眼
	'36ky': fetch36kyData, // 36氪
	sspai: fetchSspaiData, // 少数派
	xinquji: fetchXinqujiData, // 新趣集
};

app.get('/', async (req, res) => {
	const target = req.query.target;
	if (!target) {
		return res.json({
			code: 1,
			msg: `support targets: ${Object.keys(targetActionMap).join(', ')}`,
		});
	}

	const targetAction = targetActionMap[target];

	if (!targetAction) {
		return res.json({ code: 1, msg: `target ${target} is not supported` });
	}

	try {
		const list = await targetAction();
		res.json({ code: 0, list: list });
	} catch (err) {
		console.error(err);
		res.json({ code: 1, msg: err.message });
	}
});

app.use((req, res, next) => {
	next();
});

app.use((err, req, res, next) => {
	console.error(err);
	res.json({ code: 1, msg: err.message });
});

process.on('uncaughtException', (err) => {
	console.error(err);
	res.json({ code: 1, msg: err.message });
});

if (process.env.NODE_ENV === 'dev') {
	app.listen('3000', () => {
		console.log('Express is running in http://localhost:3000');
	});
}

module.exports = app;
