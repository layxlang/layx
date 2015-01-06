import os
import sys

inputPath = "../lib/" # "input/"
outputPath = "output/"

with open(inputPath + "include.js") as includejs:
	files = includejs.read().split("\n")
	files = files[files.index('//PACKER_INIT//')+1:files.index('//PACKER_END//')]
	files = [inputPath+f.split("'")[1] for f in files if (not "//" in f) or f.index("//") > f.index("'")]

def pack(name, version, minext = ".min", removeFirstComments = False, packNormal = False):
	input = " ".join(files)
	filename = name + "-" + version
	if packNormal:
		# normal
		output = outputPath + filename + ".js"
		cmd = "cat %s > %s" % (input, output)
		print "packing normal...\n  " + output
		os.system(cmd)
	# minimized
	minifier = "uglifyjs/bin/uglifyjs -o "
	output = outputPath + filename + minext + ".js"
	commentsHack = "var comments = undefined;" if removeFirstComments else ""
	comments = "/*! Layx %s | (c) 2014 Layx, layx.org | layx.org/license */%s" % (version, commentsHack)
	cmd = '(echo "%s" && cat %s) | %s %s' % (comments, input, minifier, output)
	print "packing minimized...\n  " + output
	os.system(cmd)

if len(sys.argv) == 1:
	print "usage: python %s [VERSION]\nexample: python %s 1.0" % (sys.argv[0], sys.argv[0])
else:
	unc = raw_input("Do you have uncommited changes? (Y/n) ")
	if unc.lower() == "n":
		version = sys.argv[1]
		name = "layx"
		pack(name, version)
		del files[0] # Assuming jQuery == files[0]
		pack(name, version, "-nojq.min", True)
		os.system("open " + outputPath)
	else:
		print "\n[!] Please commit or stash all your files before packing.",
		print "\n    That makes sure your files are official.\n"
