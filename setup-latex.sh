#!/bin/bash

# LaTeX CV Generator Setup Script
# This script installs LaTeX and required packages for CV generation

echo "🎯 Setting up LaTeX for CV generation..."

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install TeX Live (LaTeX distribution)
echo "📚 Installing TeX Live LaTeX distribution..."
sudo apt install -y texlive-latex-base texlive-latex-recommended texlive-latex-extra

# Install additional packages for better fonts and symbols
echo "🎨 Installing additional LaTeX packages..."
sudo apt install -y texlive-fonts-recommended texlive-fonts-extra

# Install XeTeX for better font support (optional but recommended)
echo "🔤 Installing XeTeX for enhanced font support..."
sudo apt install -y texlive-xetex

# Install latexmk for better compilation
echo "⚙️ Installing latexmk..."
sudo apt install -y latexmk

# Install fontawesome package for icons
echo "⭐ Installing FontAwesome support..."
sudo apt install -y texlive-fonts-extra

# Test installation
echo "🧪 Testing LaTeX installation..."
if command -v pdflatex &> /dev/null; then
    echo "✅ pdflatex is installed successfully!"
    pdflatex --version | head -1
else
    echo "❌ pdflatex installation failed!"
    exit 1
fi

# Create a test LaTeX file to verify everything works
echo "📄 Creating test CV document..."
cat > /tmp/test_cv.tex << 'EOF'
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{geometry}
\geometry{margin=0.7in}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\begin{document}

\begin{center}
    \textbf{\Huge \scshape Test CV} \\ \vspace{1pt}
    \Large \textit{LaTeX CV Generator Test} \\ \vspace{5pt}
\end{center}

\begin{center}
    \small \faEnvelope\ test@example.com $|$ \faPhone\ +1234567890
\end{center}

\section{Test Section}
This is a test CV document to verify that LaTeX and all required packages are properly installed.

\subsection{Features Working}
\begin{itemize}
    \item FontAwesome icons: \faLinkedin\ \faGithub\ \faEnvelope\ \faPhone
    \item Professional formatting
    \item Proper fonts and spacing
\end{itemize}

\end{document}
EOF

# Compile test document
echo "🔨 Compiling test CV..."
cd /tmp
if pdflatex -interaction=nonstopmode test_cv.tex > /dev/null 2>&1; then
    echo "✅ Test CV compiled successfully!"
    echo "📁 Test PDF created at: /tmp/test_cv.pdf"
    ls -la /tmp/test_cv.pdf
else
    echo "❌ Test CV compilation failed!"
    echo "🔍 Checking error details..."
    pdflatex -interaction=nonstopmode test_cv.tex
    exit 1
fi

# Clean up test files
rm -f /tmp/test_cv.*

echo ""
echo "🎉 LaTeX CV Generator setup completed successfully!"
echo ""
echo "📋 Installation Summary:"
echo "   ✅ TeX Live LaTeX distribution"
echo "   ✅ Additional LaTeX packages"
echo "   ✅ FontAwesome support"
echo "   ✅ XeTeX for enhanced fonts"
echo "   ✅ latexmk compilation tool"
echo ""
echo "🚀 You can now use the LaTeX CV generator in your Spring Boot application!"
echo "💡 Use the endpoint: GET /api/cv/generate/latex/{profileId}"
echo ""
