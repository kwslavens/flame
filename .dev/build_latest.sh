docker build -t kwslavens74/dragons-flame -t "kwslavens74/dragons-flame:$1" -f .docker/Dockerfile . \
  && docker push kwslavens74/dragons-flame && docker push "kwslavens74/dragons-flame:$1"