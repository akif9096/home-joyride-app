pipeline {
agent any


tools {
    nodejs 'NodeJS'
}

stages {

    stage('Checkout') {
        steps {
            git branch: 'main',
                url: 'https://github.com/akif9096/home-joyride-app.git'
        }
    }

    stage('Install Dependencies') {
        steps {
            bat 'npm install'
        }
    }

    stage('Build') {
        steps {
            bat 'npm run build'
        }
    }

    stage('Archive Artifacts') {
        steps {
            archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
        }
    }
}

post {
    success {
        echo 'Build completed successfully.'
    }

    failure {
        echo 'Build failed.'
    }
}
```

}
