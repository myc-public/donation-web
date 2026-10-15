# Front donation-web : build Vite (dist/, construit par la CI : npm ci && npm run build) servi par nginx UBI.
# Contexte = racine du depot (.dockerignore : dist/ et nginx/ seulement). UID arbitraire OpenShift (groupe 0).
# nginx 1.26 UBI 9, epinglee par digest : mise a jour explicite
ARG BASE_IMAGE=registry.access.redhat.com/ubi9/nginx-126@sha256:0c3626527f8172f2d54ff67bb25ee286640572ff90a0002bcbe926a9c85ed079
FROM ${BASE_IMAGE}

USER 0
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/csp.conf /etc/nginx/csp.conf
COPY dist/ /opt/app-root/src/

USER 1001
RUN nginx -t && rm -f /tmp/nginx.pid
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
