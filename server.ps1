# ==========================================================================
# Native PowerShell Static Web Server for StudySnap AI
# Host port: 8001
# ==========================================================================

$port = 8002
$workspace = "C:\project neeraj"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "🚀 StudySnap AI Live Server started successfully!"
    Write-Host "👉 Access the app at: http://localhost:$port/"
    Write-Host "Press Ctrl+C inside terminal to stop the server."

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $response.AppendHeader("Access-Control-Allow-Origin", "*")
        $response.AppendHeader("Access-Control-Allow-Headers", "*")
        $response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

        # Handle CORS preflight
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.OutputStream.Close()
            continue
        }
        
        $urlPath = $request.Url.LocalPath

        # API proxy endpoint
        if ($urlPath -eq "/api/chat") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $apiKey = $request.Headers["x-api-key"]

            $client = New-Object System.Net.WebClient
            $client.Headers.Add("Content-Type", "application/json")
            $client.Headers.Add("Authorization", "Bearer $apiKey")

            try {
                $result = $client.UploadString("https://api.openai.com/v1/chat/completions", "POST", $body)
                $response.ContentType = "application/json; charset=utf-8"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($result)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 502
                $err = [System.Text.Encoding]::UTF8.GetBytes('{"error":{"message":"Proxy request failed: ' + $_.Exception.Message + '"}}')
                $response.ContentType = "application/json"
                $response.ContentLength64 = $err.Length
                $response.OutputStream.Write($err, 0, $err.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # Route path mapping
        if ($urlPath -eq "/" -or [string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "/index.html"
        }
        
        $cleanPath = $urlPath.Replace("/", "\").TrimStart('\')
        $localPath = Join-Path $workspace $cleanPath
        
        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $mime = "text/plain"
            if ($ext -eq ".html" -or $ext -eq ".htm") { $mime = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $mime = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $mime = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".png") { $mime = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $mime = "image/jpeg" }
            elseif ($ext -eq ".svg") { $mime = "image/svg+xml" }
            elseif ($ext -eq ".ico") { $mime = "image/x-icon" }
            
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found - StudySnap AI Live Server")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error starting server: $_"
} finally {
    $listener.Close()
}
