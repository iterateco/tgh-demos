aws s3 sync ./dist/assets s3://thegreathigh.com/game/assets --delete
aws cloudfront create-invalidation --distribution-id E2CUNP09FMM542 --paths "/*"