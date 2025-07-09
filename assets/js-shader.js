const canvases = document.querySelectorAll(".js-swirl-canvas");

const generateCanvas = (canvas, i, hardRestart) => {
	let transitionProgress = 0;
	const transitionDuration = 1.5; // x 2 = total seconds
	let time = Math.random() * 200;
	const frameDuration = 1000 / 30;
	let colorThemes = [
		{
			foreground: '#D1D2D1', // gray
			background: '#021CEE', // blue
		},
		{
			foreground: '#021CEE', // blue
			background: '#0C0C0C', // offblack
		}
	];
	let currentThemeIndex = 0;
	let previousThemeIndex = 0;

	const canvasId = "swirl-canvas-" + i;
	canvas.id = canvasId;
	const colorThemesCount = colorThemes.length;
	const maxIndex = colorThemesCount - 1;
	const buttons = document.querySelectorAll(".js-benefits-button");
	var resizeDebounce, gl, program;
	let renderLoopActive = true;

	const vertexShaderSource = `
		attribute vec2 aVertexPosition;
		attribute vec2 aTextureCoord;
		varying highp vec2 vTextureCoord;

		void main(void) {
			gl_Position = vec4(aVertexPosition, 0.0, 1.0);
			vTextureCoord = aTextureCoord;
		}
				`;
	let fragmentShaderSource = null;

	// -------------------- Helpers --------------------

	const setupShader = async () => {
		try {
			const response = await fetch("assets/shader.frag");
			fragmentShaderSource = await response.text();
			if (!fragmentShaderSource) {
				console.error("Fragment shader not loaded");
				return;
			}

			if (buttons[0]) {
				buttons[0].addEventListener("click", () => {
					onClick(-1);
				});
			}

			if (buttons[1]) {
				buttons[1].addEventListener("click", () => {
					onClick(1);
				});
			}

			setInterval(() => {
				onClick(1);
			}, 10000);

			gl = canvas.getContext("webgl");
			program = gl.createProgram();

			const vertShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertShader, vertexShaderSource);
			gl.compileShader(vertShader);

			// Check vertex shader compilation status
			if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
				const errorMessage = gl.getShaderInfoLog(vertShader);
				console.error("Vertex shader compilation error:", errorMessage);
				return;
			}

			const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragShader, fragmentShaderSource);
			gl.compileShader(fragShader);

			// Check fragment shader compilation status
			if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
				const errorMessage = gl.getShaderInfoLog(fragShader);
				console.error("Fragment shader compilation error:", errorMessage);
				return;
			}

			gl.attachShader(program, vertShader);
			gl.attachShader(program, fragShader);
			gl.linkProgram(program);
			gl.useProgram(program);

			const vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			const vertices = new Float32Array([
				-1.0, 1.0, 0.0, 1.0, -1.0, -1, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
				1.0, 0.0,
			]);
			gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

			const position = gl.getAttribLocation(program, "aVertexPosition");
			gl.vertexAttribPointer(
				position,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				0
			);
			gl.enableVertexAttribArray(position);

			const textureCoord = gl.getAttribLocation(program, "aTextureCoord");
			gl.vertexAttribPointer(
				textureCoord,
				2,
				gl.FLOAT,
				false,
				4 * Float32Array.BYTES_PER_ELEMENT,
				2 * Float32Array.BYTES_PER_ELEMENT
			);
			gl.enableVertexAttribArray(textureCoord);

			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);

			const image = new Image();
			image.onload = function () {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					image
				);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.texParameteri(
					gl.TEXTURE_2D,
					gl.TEXTURE_MIN_FILTER,
					gl.LINEAR_MIPMAP_LINEAR
				);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.generateMipmap(gl.TEXTURE_2D);

				render();
			};
			image.crossOrigin = "use-credentials";
			image.src = "assets/img-noise.png";
		} catch (err) {
			console.error("Error loading the shader:", err);
		}
	};

	const hexToRgb = (hex) => {
		const r = parseInt(hex.slice(1, 3), 16) / 255;
		const g = parseInt(hex.slice(3, 5), 16) / 255;
		const b = parseInt(hex.slice(5, 7), 16) / 255;
		return [r, g, b];
	};

	const render = () => {
		if (!renderLoopActive) return;

		time += frameDuration / 1000;

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		const iResolution = gl.getUniformLocation(program, "u_resolution");
		gl.uniform2fv(iResolution, [canvas.width, canvas.height]);

		const iTime = gl.getUniformLocation(program, "u_time");
		gl.uniform1fv(iTime, [time]);

		// Interpolate between color themes
		const currentForegroundRgb = hexToRgb(
			colorThemes[currentThemeIndex].foreground
		);
		const previousForegroundRgb = hexToRgb(
			colorThemes[previousThemeIndex].foreground
		);
		const interpolatedForegroundRgb = previousForegroundRgb.map((c, i) => {
			return c + (currentForegroundRgb[i] - c) * transitionProgress;
		});

		const currentBackgroundRgb = hexToRgb(
			colorThemes[currentThemeIndex].background
		);
		const previousBackgroundRgb = hexToRgb(
			colorThemes[previousThemeIndex].background
		);
		const interpolatedBackgroundRgb = previousBackgroundRgb.map((c, i) => {
			return c + (currentBackgroundRgb[i] - c) * transitionProgress;
		});

		const iForegroundColor = gl.getUniformLocation(
			program,
			"u_foreground_color"
		);
		const iBackgroundColor = gl.getUniformLocation(
			program,
			"u_background_color"
		);
		gl.uniform3fv(iForegroundColor, interpolatedForegroundRgb);
		gl.uniform3fv(iBackgroundColor, interpolatedBackgroundRgb);

		if (transitionProgress < 1) {
			transitionProgress += frameDuration / (transitionDuration * 1000);
			if (transitionProgress > 1) transitionProgress = 1;
		}

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		setTimeout(() => requestAnimationFrame(render), frameDuration);
	};

	const resize = () => {
		if (!canvas) return;
		try {
			let scale = window.devicePixelRatio || 1;
			const canvasBounds = canvas.getBoundingClientRect();
			if (window.innerWidth / scale < 500) {
				scale = 1.5;
			}
			canvas.width = canvasBounds.width * scale;
			canvas.height = canvasBounds.height * scale;
			gl.viewport(0, 0, canvas.width, canvas.height);
		} catch (error) {
			console.error("Error resizing the canvas:", error);
		}
	};

	// -------------------- Responders --------------------

	const onResize = () => {
		if (resizeDebounce) {
			clearTimeout(resizeDebounce);
		}

		resizeDebounce = setTimeout(() => {
			resize();
		}, 100);
	};

	const onClick = (direction) => {
		previousThemeIndex = currentThemeIndex;
		currentThemeIndex =
			currentThemeIndex + direction == colorThemesCount // if past end, go to 0
				? 0
				: currentThemeIndex + direction == -1 // if before beginning, go to end
				? maxIndex
				: currentThemeIndex + direction; // proceed

		transitionProgress = 0;
	};

	// This ensures the shader pauses when the canvas is not in the DOM, and resumes when it is
	const observer = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				if (mutation.removedNodes.length > 0) {
					mutation.removedNodes.forEach((node) => {
						if (node.id === canvasId) {
							renderLoopActive = false;
							canvas.removeEventListener("click", onClick);
						}
					});
				}
				if (mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach((node) => {
						if (node.id === canvasId) {
							canvas = node;
							renderLoopActive = true;
							setupShader();
						}
					});
				}
			}
		}
	});

	window.addEventListener("load", () => {
		setupShader().then(() => {
			resize();
			setTimeout(resize, 600);
			setTimeout(resize, 1500);
		});

		window.addEventListener("resize", onResize);

		observer.observe(document.body, { childList: true, subtree: true });
	});

	if (hardRestart) {
		setupShader().then(() => {
			resize();
			setTimeout(resize, 600);
		});
	}
};

canvases.forEach((canvas, i) => {
	generateCanvas(canvas, i);
});
