const path = require("node:path");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const Image = require("@11ty/eleventy-img");

module.exports = function(eleventyConfig) {
	eleventyConfig.ignores.add("src/_schemas/*");

	eleventyConfig.addPassthroughCopy("./src/*.{css,png}");

  eleventyConfig.addPassthroughCopy("src/uploads/*");

  eleventyConfig.addPassthroughCopy({
		"src/uploads/": "public/uploads/"});

	eleventyConfig.addPassthroughCopy({
		"node_modules/@11ty/is-land/is-land.js": "public/is-land.js",

		// YouTube embed
		"node_modules/lite-youtube-embed/src/lite-yt-embed.js": "public/lite-yt-embed.js",
		"node_modules/lite-youtube-embed/src/lite-yt-embed.css": "public/lite-yt-embed.css",

		// Filter-container
		"node_modules/@zachleat/filter-container/filter-container.js": "public/filter-container.js",
	});

	eleventyConfig.addPlugin(pluginRss);

	eleventyConfig.setLiquidOptions({
		jsTruthy: true
	});

	eleventyConfig.addFilter("toSlugList", (subject) => {
		return subject.filter(key => key !== "sites")
			.map(key => eleventyConfig.getFilter("slugify")(key))
			.join(",");
	});

	eleventyConfig.addFilter("keys", (subject) => {
		return Object.keys(subject).filter(key => {
			return key !== "all" && key !== "sites";
		});
	});

	eleventyConfig.addFilter("normalize", (subject, delimiter) => {
		if(Array.isArray(subject)) {
			return subject.join(delimiter || ", ");
		}
		return subject;
	});

	eleventyConfig.addFilter("toDateFormat", date => {
		return date.getFullYear();
	});

	async function remoteImage(url, title, isLCP = false, useOpenGraph = false) {
		let remoteUrl = `https://v1.${useOpenGraph ? "opengraph" : "screenshot"}.11ty.dev/${encodeURIComponent(url)}/opengraph/`
		let metadata = await Image(remoteUrl, {
			widths: [400, 800],
			formats: ["webp", "jpeg"],
			outputDir: "./_site/screenshots/",
			urlPath: "/screenshots/",
		});

		let imageAttributes = {
			alt: `Screenshot of ${title}`,
			class: "site-screenshot",
			sizes: "(min-width: 37.5em) 50vw, 100vw",
			loading: isLCP ? "eager" : "lazy",
			fetchpriority: isLCP ? "high" : "auto",
			decoding: "async",
		};

		// You bet we throw an error on a missing alt (alt="" works okay)
		return Image.generateHTML(metadata, imageAttributes);
	}

	eleventyConfig.addShortcode("embedScreenshot", (url, title, isLCP) => remoteImage(url, title, isLCP));
	eleventyConfig.addShortcode("embedOpenGraph", (url, title, isLCP) => remoteImage(url, title, isLCP, true));

	eleventyConfig.addShortcode("embedFavicon", async function(filepath, title) {
		let metadata = await Image(path.join("./src/", filepath), {
			widths: [64],
			formats: ["png"],
			outputDir: "./_site/img/",
			urlPath: "/img/",
		});

		let imageAttributes = {
			alt: `Favicon for ${title}`,
			class: "site-favicon",
			loading: "lazy",
			decoding: "async",
		};

		// You bet we throw an error on a missing alt (alt="" works okay)
		return Image.generateHTML(metadata, imageAttributes);
	});

	eleventyConfig.addShortcode("embedYouTube", function(slug, label) {
		let fallback = `https://i.ytimg.com/vi/${slug}/maxresdefault.jpg`;

		return `<is-land on:visible>
	<template data-island="once">
		<link rel="stylesheet" href="/public/lite-yt-embed.css">
		<script src="/public/lite-yt-embed.js"></script>
		<lite-youtube videoid="${slug}" playlabel="Play${label ? `: ${label}` : ""}" style="background-image:url('${fallback}')">
			<a href="https://youtube.com/watch?v=${slug}" class="lty-playbtn" title="Play Video"><span class="lyt-visually-hidden">Play Video${label ? `: ${label}` : ""}</span></a>
		</lite-youtube>
	</template>
</is-land>`;
	});

	return {
		dir: {
			input: "src",
		},
	};
};