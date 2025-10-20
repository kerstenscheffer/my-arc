<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Highlight Circle</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 15px;
        }

        .download-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .download-btn:hover {
            background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%);
            transform: translateY(-2px);
        }

        .preview-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }

        .size-info {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            text-align: center;
        }

        /* The actual highlight circle */
        .highlight-circle {
            width: 200px;
            height: 200px;
            position: relative;
            background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }

        .inner-circle {
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .youtube-icon {
            width: 80px;
            height: 56px;
            fill: #FF0000;
        }

        /* Alternative versions for testing */
        .version-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin-top: 40px;
            max-width: 600px;
        }

        .version-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .mini-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .mini-circle:hover {
            transform: scale(1.1);
        }

        .version-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            text-align: center;
        }

        /* Version 1: Gradient border, white bg */
        .v1 {
            background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%);
            padding: 4px;
        }
        .v1 .inner {
            background: #fff;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Version 2: Full gradient bg */
        .v2 {
            background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%);
        }

        /* Version 3: Black bg with gradient border */
        .v3 {
            background: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%);
            padding: 4px;
        }
        .v3 .inner {
            background: #000;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Version 4: Subtle gradient bg */
        .v4 {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
            border: 2px solid;
            border-image: linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%) 1;
        }

        .mini-youtube {
            width: 32px;
            height: 22px;
        }
    </style>
</head>
<body>
    <div class="controls">
        <button class="download-btn" onclick="downloadHighlight()">
            📥 Download PNG
        </button>
        <button class="download-btn" onclick="downloadAllVersions()">
            📦 Download All Versions
        </button>
    </div>

    <div class="preview-container">
        <div class="size-info">
            Main Version - 200x200px - Perfect voor Instagram Highlights
        </div>

        <!-- Main highlight circle for download -->
        <div id="main-highlight" class="highlight-circle">
            <div class="inner-circle">
                <svg class="youtube-icon" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            </div>
        </div>

        <div class="size-info">
            Klik op een versie hieronder om die als hoofdversie in te stellen
        </div>

        <!-- Alternative versions grid -->
        <div class="version-grid">
            <div class="version-item">
                <div class="mini-circle v1" onclick="switchToVersion(1)">
                    <div class="inner">
                        <svg class="mini-youtube" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                </div>
                <div class="version-label">Wit + Border</div>
            </div>

            <div class="version-item">
                <div class="mini-circle v2" onclick="switchToVersion(2)">
                    <svg class="mini-youtube" viewBox="0 0 24 24" fill="white">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <div class="version-label">Full Gradient</div>
            </div>

            <div class="version-item">
                <div class="mini-circle v3" onclick="switchToVersion(3)">
                    <div class="inner">
                        <svg class="mini-youtube" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </div>
                </div>
                <div class="version-label">Zwart + Border</div>
            </div>

            <div class="version-item">
                <div class="mini-circle v4" onclick="switchToVersion(4)">
                    <svg class="mini-youtube" viewBox="0 0 24 24" fill="#FF0000">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                </div>
                <div class="version-label">Subtiel</div>
            </div>
        </div>
    </div>

    <script>
        function downloadHighlight() {
            const element = document.getElementById('main-highlight');
            
            html2canvas(element, {
                scale: 3,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: 200,
                height: 200
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'youtube-highlight-circle.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error('Download failed:', err);
                alert('Download failed. Make sure html2canvas is loaded.');
            });
        }

        function downloadAllVersions() {
            const versions = [1, 2, 3, 4];
            let currentVersion = 0;
            
            function downloadNext() {
                if (currentVersion >= versions.length) {
                    alert('Alle versies gedownload!');
                    return;
                }
                
                switchToVersion(versions[currentVersion], false);
                
                setTimeout(() => {
                    const element = document.getElementById('main-highlight');
                    html2canvas(element, {
                        scale: 3,
                        backgroundColor: null,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        width: 200,
                        height: 200
                    }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `youtube-highlight-v${versions[currentVersion]}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        
                        currentVersion++;
                        setTimeout(downloadNext, 500);
                    });
                }, 300);
            }
            
            downloadNext();
        }

        function switchToVersion(version, showAlert = true) {
            const mainCircle = document.getElementById('main-highlight');
            const innerCircle = mainCircle.querySelector('.inner-circle');
            const icon = mainCircle.querySelector('.youtube-icon');
            
            // Reset styles
            mainCircle.style.padding = '';
            mainCircle.style.border = '';
            mainCircle.style.borderImage = '';
            innerCircle.style.background = '';
            icon.style.fill = '';
            
            switch(version) {
                case 1: // Wit + Border
                    mainCircle.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)';
                    mainCircle.style.padding = '8px';
                    innerCircle.style.background = '#fff';
                    icon.style.fill = '#FF0000';
                    break;
                    
                case 2: // Full Gradient
                    mainCircle.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)';
                    mainCircle.style.padding = '0';
                    innerCircle.style.background = 'transparent';
                    icon.style.fill = 'white';
                    break;
                    
                case 3: // Zwart + Border
                    mainCircle.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)';
                    mainCircle.style.padding = '8px';
                    innerCircle.style.background = '#000';
                    icon.style.fill = '#FF0000';
                    break;
                    
                case 4: // Subtiel
                    mainCircle.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
                    mainCircle.style.border = '4px solid';
                    mainCircle.style.borderImage = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%) 1';
                    mainCircle.style.padding = '0';
                    innerCircle.style.background = 'transparent';
                    icon.style.fill = '#FF0000';
                    break;
            }
            
            if (showAlert) {
                alert(`Versie ${version} geselecteerd! Klik "Download PNG" om deze versie te downloaden.`);
            }
        }

        // Set default version
        switchToVersion(1, false);
    </script>
</body>
</html>
