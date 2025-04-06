FROM denoland/deno:2.2.8

WORKDIR /app

# Copy dependency specification first to leverage Docker cache
COPY deno.json deno.lock ./

# Copy application source code
COPY . .

# Cache dependencies
RUN deno cache main.ts

# Default port for SSE mode
EXPOSE 8888

# Set the default command
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--allow-run", "main.ts", "--mode=sse", "--port=8888"] 