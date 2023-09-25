FROM docker.io/jenkins/jenkins:lts
ARG JAVA_OPTS
ENV JAVA_OPTS "-Djenkins.install.runSetupWizard=false ${JAVA_OPTS:-}"
ENV JENKINS_HOME "/var/jenkins_home"
USER jenkins