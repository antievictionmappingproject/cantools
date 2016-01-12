def getxls(data, name=None):
	import xlrd
	wb = xlrd.open_workbook(file_contents=data)
	s = wb.sheet_by_name(name or wb.sheet_names()[0])
	return s

def _svlines(data):
	return data.replace("\r\n", "\n").replace("\r", "\n").split("\n")

def gettsv(data):
	return [l.split("\t") for l in _svlines(data) if l]

def getcsv(data, mod=False):
	return [l.split(",") for l in _svlines(data) if l]

# eh, module reads it better sometimes (especially if we write(_svlines(read())) first)
def getcsvmod(fname):
	import csv
	d = []
	f = open(fname)
	reader = csv.reader(f)
	for row in reader:
		d.append(row)
	f.close()
	return d

def flatten(obj):
	keys = []
	vals = []
	for key, val in obj.items():
		if isinstance(val, dict):
			subkeys, subvals = flatten(val)
			for subkey in subkeys:
				fullsubkey = "%s.%s"%(key, subkey)
				if fullsubkey not in keys:
					keys.append(fullsubkey)
			vals += subvals
		else:
			if key not in keys:
				keys.append(key)
			vals.append(val)
	return keys, vals

def arr2csv(arr):
	return "\n".join([",".join(flatten(arr[0])[0])] + [",".join([str(i) for i in flatten(obj)[1]]) for obj in arr])