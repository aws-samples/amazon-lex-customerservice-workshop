AWS_REGION ?= us-east-1
ARTIFACTS_BUCKET ?= lex-customer-service-workshop

target:
	$(info ${HELP_MESSAGE})
	@exit 0

package:
	cd lambda-functions/load-data/ && \
	npm install && \
	cd ../../cloudformation && \
	sam package \
		-t sam.yaml \
		--s3-bucket ${ARTIFACTS_BUCKET} \
		--s3-prefix workshop-lambdas \
		--region ${AWS_REGION} \
		--output-template-file sam-packaged.yaml && \
	aws s3 cp sam-packaged.yaml s3://${ARTIFACTS_BUCKET}/setup.yaml	 

define HELP_MESSAGE

	Environment variables:

	AWS_REGION: "us-east-1"
		Description: Feature branch name used as part of stacks name
	ARTIFACTS_BUCKET: "lex-customer-service-workshop"
		Description: S3 Bucket name used for deployment artifacts
	Common usage:

	...::: Bootstraps environment with necessary tools like SAM CLI, cfn-lint, etc. :::...
	$ make init

	...::: Package all resources :::...
	$ make package

endef
